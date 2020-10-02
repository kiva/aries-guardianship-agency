import { Injectable, CacheStore, CACHE_MANAGER, Inject, HttpService } from '@nestjs/common';
import cryptoRandomString from 'crypto-random-string';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolUtility } from 'protocol-common/protocol.utility';
import { DockerService } from './docker.service';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';
import { K8sService } from './k8s.service';

/**
 * TODO validation, error cases, etc
 */
@Injectable()
export class AgentManagerService {

    private readonly DEFAULT_TTL_SECONDS: number = 3600;
    private manager: IAgentManager;

    // TODO expose a non-retry call to ProtocolHttpService so we don't need to keep both
    private http: ProtocolHttpService;

    constructor(
        private readonly httpService: HttpService,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore
    ) {
        this.http = new ProtocolHttpService(httpService);
        // TODO move this logic to an agent manager factory, which can be injected via a module
        // We can also use env type to infer this
        if (process.env.MANAGER_TYPE === 'DOCKER') {
            this.manager = new DockerService();
        } else if (process.env.MANAGER_TYPE === 'K8S') {
            this.manager = new K8sService();
        } else {
            throw new Error('Invalid config for MANAGER_TYPE');
        }
    }

    /**
     * Contains the general logic to spin up an agent regardless of environment
     * TODO need to think through a few more cases - like how the public endpoints and ports will work
     * TODO need to handle error cases and ensure logging works in our deployed envs
     */
    public async spinUpAgent(walletId: string, walletKey: string, adminApiKey: string, ttl?: number,
                             seed?: string, controllerUrl?: string, agentId?: string, label?: string, autoConnect: boolean = true,
                             adminApiPort: string = process.env.AGENT_ADMIN_PORT) {
        // TODO: cleanup inconsistent return types.
        // 1  { agentId, connectionData }
        // 1a { agentId, empty }
        // 2  { agentId, container, adminApiKey }

        agentId = agentId || cryptoRandomString({length: 32, type: 'hex'});
        label = label || agentId;
        ttl = (ttl === undefined ? this.DEFAULT_TTL_SECONDS : ttl);
        const httpPort = process.env.AGENT_HTTP_PORT;

        // TODO the agent's endpoint needs to be the public one exposed to the user, eg http://our-agency.com
        // Locally we don't have that public url so we need to reference the docker container for the agency
        const agentEndpoint = `${process.env.PUBLIC_URL}/v1/router/${agentId}`;

        // TODO the webhook url should be a private one just on the network between the agent and the controller
        // since we don't want to expose the admin api publicly. Both locally and remotely this will be the docker container for the agency
        const webhookUrl = controllerUrl || `${process.env.INTERNAL_URL}/v1/controller/${agentId}`;

        try {
            // Note: according to the docs a 0 value means caching for infinity, however this does not work in practice - it doesn't cache at all
            // Short term you can pass in -1 and it will cache for max int (ie a very long time)
            // TODO Long term we should have a proper DB store for permanent agents
            // (or figure out a way to avoid having to save agent data all together)

            const agentConfig = new AgentConfig(
                walletId, walletKey, adminApiKey, agentId, label, agentEndpoint, webhookUrl, adminApiPort, httpPort, seed);
            await this.manager.startAgent(agentConfig);

            // @tothink move this caching to db
            // adding one second to cache record timeout so that spinDownAgent has time to process before cache deletes the record
            Logger.info(`record cache limit set to: ${(ttl === 0 ? ttl : ttl + 1)}`);
            await this.cache.set(agentId, {adminApiKey, ttl}, {ttl: (ttl === 0 ? ttl : ttl + 1)});

            // ttl = time to live is expected to be in seconds (which we convert to milliseconds).  if 0, then live in eternity
            if (ttl > 0) {
                setTimeout(
                    async () => {
                        await this.spinDownAgent(agentId);
                    }, ttl * 1000);
            }

            let connectionData = {};
            // when autoConnect is true, then call the createConnection method
            // when autoCorrect is not defined or null, treat it as true
            if (autoConnect === true) {
                // TODO for right now let's delay and then initiate the connection
                await this.pingConnectionWithRetry(agentId, adminApiPort, adminApiKey, parseInt(process.env.AGENT_RETRY_DURATION, 10));
                connectionData = await this.createConnection(agentId, adminApiPort, adminApiKey);
            }

            return {agentId, connectionData};
        } catch (e) {
            // one possible cause of the exception is
            // agent is already running.  We have 1 of 2 possibilities
            // 1 - agent is running and in cache
            // 2 - agent is running and not in cache
            // call to handleAlreadyRunningContainer takes care of both
            const runningData = await this.handleAlreadyRunningContainer(agentId, adminApiPort, adminApiKey, autoConnect, ttl);
            if (runningData) {
                return runningData;
            }

            // if the call to handleAlreadyRunningContainer fails,
            // let it fall through because we have a bigger problem.
            Logger.warn(`Unhandled error starting agent '${agentId}'`, e);
            throw e;
        }
    }

    /**
     * TODO we should probably respond with something
     * TODO handle case were agent not there
     */
    public async spinDownAgent(agentId: string) {
        Logger.log('Spinning down agent', agentId);
        await this.cache.del(agentId);
        await this.manager.stopAgent(agentId);
    }

    public async isAgentServerUp(agentId: string, adminPort: string, adminApiKey: string): Promise<boolean> {
        try {
            const url = `http://${agentId}:${adminPort}/status`;
            Logger.info(`agent admin url is ${url}`);
            const req: any = {
                method: 'GET',
                url,
                headers: {
                    'x-api-key': adminApiKey,
                    accept: 'application/json'
                },
            };
            const res = await this.httpService.request(req).toPromise();
            if (res.status === 200) {
                return true;
            }
        } catch (e) {}
        return false;
    }

    /**
     * TODO move to it's own class and pass in the http object
     * TODO error handling
     */
    private async createConnection(agentId: string, adminPort: string, adminApiKey: string) {
        const url = `http://${agentId}:${adminPort}/connections/create-invitation`;
        const req: any = {
            method: 'POST',
            url,
            headers: {
                'x-api-key': adminApiKey,
            },
        };

        const res = await this.http.requestWithRetry(req);
        return res.data.invitation;
    }

    /**
     * TODO move to it's own class and pass in the http object
     */
    private async pingConnectionWithRetry(agentId: string, adminPort: string, adminApiKey: string, durationMS: number) : Promise<any> {

        const startOf = new Date();
        while (durationMS > ProtocolUtility.timeDelta(new Date(), startOf)) {
            // no point in rushing this
            await ProtocolUtility.delay(1000);

            // TODO we should either add a non-retry call to ProtocolHttpService, or make the existing requestWithRetry more configurable
            // attempt a status check, if successful call it good and return
            // otherwise retry until duration is exceeded
            try {
                if (true === await this.isAgentServerUp(agentId, adminPort, adminApiKey)) {
                    Logger.info(`agent ${agentId} is up and responding`);
                    return;
                }
            } catch (e) {
                // Do nothing and try again
            }
        }

        throw new ProtocolException('Agent', `Never got a good status code from agent ${agentId}`);
    }

    /**
     * If we already have an agent running with the same agent id, don't try to start a new one, just return the connection data
     * for the existing one - we use the adminApiKey to ensure that the caller actually has permissions to query the agent
     * TODO we may want more checks here, eg to ensure the docker container is actually running, but for now we treat the cache as truth
     */
    private async handleAlreadyRunningContainer(agentId: string, adminPort: string,
                                                adminApiKey: string, autoConnect: boolean = true, ttl: number): Promise<any> {
        // TODO: cleanup inconsistent return types.
        // 1 { agentId, connectionData }
        // 2 { agentId, containerId, adminApiKey }
        // 3 null
        if (agentId) {
            let agentData: any = await this.cache.get(agentId);
            if (agentData === undefined) {
                /*
                // TODO: we would like to be able to ping agent to make sure its really available
                try {
                    await this.pingConnectionWithRetry(agentId, adminPort, adminApiKey, 10000);
                } catch (e) {
                    Logger.warn(`agent ${agentId} not found in cache and was not reachable`);
                    throw e;
                }
                */
                Logger.warn(`agent ${agentId} not found in cache...adding`);
                await this.cache.set(agentId, { adminApiKey, ttl}, {ttl});
                agentData = await this.cache.get(agentId);
            }

            Logger.log(`agent ${agentId} exists and is in cache:`, agentData);
            if (agentData && autoConnect === true) {
                // TODO need error handling if this call fails
                const connectionData = await this.createConnection(agentId, process.env.AGENT_ADMIN_PORT, adminApiKey);
                return {
                    agentId,
                    connectionData
                };
            }
            if (agentData && autoConnect === false) {
                return agentData;
            }

        }
        return null;
    }

    /**
     * TODO make this DRY with above code
     * TODO check with the goverance policy on whether to allow the connection
     */
    public async connectAgent (agentId: string, adminApiKey: string): Promise<any> {
        await this.pingConnectionWithRetry(agentId, process.env.AGENT_ADMIN_PORT, adminApiKey, parseInt(process.env.AGENT_RETRY_DURATION, 10));
        const connectionData = await this.createConnection(agentId, process.env.AGENT_ADMIN_PORT, adminApiKey);
        return { agentId, connectionData };
    }
}
