import { Injectable, CacheStore, CACHE_MANAGER, Inject } from '@nestjs/common';
import { DockerService } from './docker.service';
import { IAgentManager } from './agent.manager.interface';
import cryptoRandomString from 'crypto-random-string';
import { Logger } from '@kiva/protocol-common/logger';
import { AgentConfig } from './agent.config';
import { K8sService } from './k8s.service';

/**
 * TODO validation, error cases, etc
 */
@Injectable()
export class AgentManagerService {

    private readonly DEFAULT_TTL_SECONDS: number = 3600;
    private manager: IAgentManager;

    constructor(@Inject(CACHE_MANAGER) private readonly cache: CacheStore) {
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
    public async spinUpAgent(walletId: string, walletKey: string, adminApiKey: string, ttl: number) {
        // 0 is a valid value in this case as it means service will run indefinitely
        ttl = (ttl === undefined ? this.DEFAULT_TTL_SECONDS : ttl);
        const agentId = cryptoRandomString({ length: 32, type: 'hex' });
        // TODO: could it be possible the same port is randomly generated?
        const adminPort = this.generateRandomPort();
        const httpPort = this.generateRandomPort();

        // TODO the agent's endpoint needs to be the public one exposed to the user, eg http://our-agency.com
        // Locally we don't have that public url so we need to reference the docker container for the agency
        const agentEndpoint = `${process.env.PUBLIC_URL}/v1/router/${agentId}`;

        // TODO the webhook url should be a private one just on the network between the agent and the controller
        // since we don't want to expose the admin api publicly. Both locally and remotely this will be the docker container for the agency
        const webhookUrl = `${process.env.INTERNAL_URL}/v1/controller/${agentId}`;

        const agentConfig = new AgentConfig(walletId, walletKey, adminApiKey, agentId, agentEndpoint, webhookUrl, adminPort, httpPort);

        const containerId = await this.manager.startAgent(agentConfig);

        // @tothink move this caching to db
        // adding one second to cache record timeout so that spinDownAgent has time to process before cache deletes the record
        Logger.info(`record cache limit set to: ${(ttl === 0 ? ttl : ttl + 1000)}}`);
        await this.cache.set(agentId, { containerId, adminPort, httpPort, adminApiKey, ttl }, {ttl: (ttl === 0 ? ttl : ttl + 1000)});
        // ttl = time to live is expected to be in seconds (which we convert to milliseconds).  if 0, then live in eternity
        if (ttl > 0) {
            setTimeout(
                async () => {
                    await this.spinDownAgent(agentId);
                }, ttl * 1000);
        }
        return { agentId, containerId, adminPort, httpPort };
    }

    /**
     * TODO we should probably respond with something
     */
    public async spinDownAgent(agentId: string) {
        // TODO: do we need to remove this entry
        const agent: any = await this.cache.get(agentId);
        await this.cache.del(agentId);
        Logger.log('Spinning down agent', agent);
        // TODO handle case were agent not there
        await this.manager.stopAgent(agent.containerId);
    }

    /**
     * TODO not sure if we'll keep this around because it doesn't guarantee port overlaps, and also, ports are only really important when
     * testing on a mac. We deployed in k8s all agents can have the same ports and its file
     * Generates a random port between 5000-9999
     */
    private generateRandomPort(): string {
        return (Math.floor(5000 + Math.random() * 5000)).toString();
    }
}
