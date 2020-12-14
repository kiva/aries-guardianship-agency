import { Injectable, CacheStore, CACHE_MANAGER, Inject, HttpService } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { ProtocolUtility } from 'protocol-common/protocol.utility';
import { DockerService } from './docker.service';
import { IAgentManager } from './agent.manager.interface';
import { AgentConfig } from './agent.config';
import { K8sService } from './k8s.service';
import { AgentCreateDto } from './dtos/agent.create.dto';

/**
 * TODO validation, error cases, etc
 */
@Injectable()
export class AgentManagerService {

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
     * TODO need to handle error cases and ensure logging works in our deployed envs
     * TODO: cleanup inconsistent return types.
     *  1  { agentId, connectionData }
     *  1a { agentId, empty }
     *  2  { agentId, container, adminApiKey }
     */
    public async spinUpAgent(agentDto: AgentCreateDto) {
        const agentConfig = new AgentConfig(agentDto);
        try {
            await this.manager.startAgent(agentConfig);
            await this.setAgentCache(agentConfig);

            // ttl = time to live is expected to be in seconds (which we convert to milliseconds).  if 0, then live in eternity
            if (agentConfig.ttl > 0) {
                setTimeout(
                    async () => {
                        await this.spinDownAgent(agentConfig.agentId);
                    }, agentConfig.ttl * 1000);
            }

            let connectionData = {};
            // when autoConnect is true, then call the createConnection method, when autoCorrect is not defined or null, treat it as true
            if (agentDto.autoConnect === true) {
                // TODO for right now let's delay and then initiate the connection
                const retryDuration = parseInt(process.env.AGENT_RETRY_DURATION, 10);
                await this.pingConnectionWithRetry(agentConfig.agentId, agentConfig.adminPort, agentConfig.adminApiKey, retryDuration);
                connectionData = await this.createConnection(agentConfig.agentId, agentConfig.adminPort, agentConfig.adminApiKey);
            }

            return { agentId: agentConfig.agentId, connectionData };
        } catch (e) {
            Logger.warn(`exception on startAgent() for agent '${agentDto.agentId}'`, e);
            // one possible cause of the exception is
            // agent is already running.  We have 1 of 2 possibilities
            // 1 - agent is running and in cache
            // 2 - agent is running and not in cache
            // call to handleAlreadyRunningContainer takes care of both
            const runningData = await this.handleAlreadyRunningContainer(agentConfig, agentDto.autoConnect);
            if (runningData) {
                return runningData;
            }

            // if the call to handleAlreadyRunningContainer fails,
            // let it fall through because we have a bigger problem.
            Logger.warn(`Unhandled error starting agent '${agentDto.agentId}'...see previous messages for details`);
            throw e;
        }
    }

    /**
     * TODO we should probably respond with something
     * TODO handle case were agent not there
     */
    public async spinDownAgent(agentId: string) {
        try {
            Logger.log('Spinning down agent', agentId);
            await this.cache.del(agentId);
            await this.manager.stopAgent(agentId);
        } catch (e) {
            Logger.warn(`error shutting down agent: '${e.message}'`, e);
        }
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
    private async handleAlreadyRunningContainer(agentConfig: AgentConfig, autoConnect: boolean): Promise<any> {
        // TODO: cleanup inconsistent return types.
        // 1 { agentId, connectionData }
        // 2 { agentId, containerId, adminApiKey }
        // 3 null
        if (agentConfig.agentId) {
            let agentData: any = await this.cache.get(agentConfig.agentId);
            if (agentData === undefined) {
                /*
                // TODO: we would like to be able to ping agent to make sure its really available
                try {
                    await this.pingConnectionWithRetry(agentId, adminApiPort, adminApiKey, 10000);
                } catch (e) {
                    Logger.warn(`agent ${agentId} not found in cache and was not reachable`);
                    throw e;
                }
                */
                Logger.warn(`agent ${agentConfig.agentId} not found in cache...adding`);
                await this.setAgentCache(agentConfig);
                agentData = await this.cache.get(agentConfig.agentId);
            } else {
                Logger.log(`agent ${agentConfig.agentId} exists and is in cache:`, agentData);
            }

            if (agentData && autoConnect === true) {
                // TODO need error handling if this call fails
                const connectionData = await this.createConnection(agentConfig.agentId, agentConfig.adminPort, agentConfig.adminApiKey);
                return {
                    agentId: agentConfig.agentId,
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
        const agentCache: any = await this.cache.get(agentId);
        const adminPort = (agentCache ? agentCache.adminApiPort : process.env.AGENT_ADMIN_PORT);
        await this.pingConnectionWithRetry(agentId, adminPort, adminApiKey, parseInt(process.env.AGENT_RETRY_DURATION, 10));
        const connectionData = await this.createConnection(agentId, adminPort, adminApiKey);
        return { agentId, connectionData };
    }

    /**
     * This gets called in multiple places so ensuring logic stays the same
     */
    private async setAgentCache(agentConfig: AgentConfig): Promise<void> {
        Logger.info(`record cache limit set to: ${agentConfig.cacheTtl}`);
        await this.cache.set(
            agentConfig.agentId,
            {
                adminApiKey: agentConfig.adminApiKey,
                adminApiPort: agentConfig.adminPort,
                ttl: agentConfig.ttl
            },
            {
                ttl: agentConfig.cacheTtl
            }
        );
    }
}
