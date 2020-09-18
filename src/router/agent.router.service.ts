import { Injectable, CacheStore, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';

/**
 *
 */
@Injectable()
export class AgentRouterService {

    /**
     * Inject dependencies
     */
    constructor() { }

    public async getUrl(agentId: string) {
        // TODO make http configurable, in case we every want to enable https without or docker/k8s network
        return 'http://' + agentId + ':' + process.env.AGENT_HTTP_PORT;
    }

    public getRouter() {
        return async (req) => {
            const parts = req.path.split('/');
            const agentId = parts[3];
            const url = await this.getUrl(agentId);
            Logger.log('Router proxy to ', url); // TODO remove this log eventually, still useful now
            return url;
        };
    }

}
