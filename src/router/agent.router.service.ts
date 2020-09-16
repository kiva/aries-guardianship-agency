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
    constructor(@Inject(CACHE_MANAGER) private readonly cache: CacheStore) { }

    public async getUrl(agentId: string) {
        const agent: any = await this.cache.get(agentId);
        // TODO handle case where the agent isn't in the cache/storage
        // TODO make http configurable, in case we every want to enable https without or docker/k8s network
        return 'http://' + agentId + ':' + agent.httpPort;
    }

    public async getAdminUrl(agentId: string) {
        const agent: any = await this.cache.get(agentId);
        // TODO handle case where the agent isn't in the cache/storage
        // TODO make http configurable, in case we every want to enable https without or docker/k8s network
        return 'http://' + agentId + ':' + agent.adminPort;
    }

    public getRouter() {
        return async (req) => {
            // path will be either of
            // /v1/router/admin/ or
            // /v1/router/agent/
            const parts = req.path.split('/');
            const route = parts[3];
            const agentId = parts[4];
            let url: string = '';
            if (route === 'admin') {
                url = await this.getAdminUrl(agentId);
            }else {
                url = await this.getUrl(agentId);
            }
            Logger.log('Router proxy to ', url); // TODO remove this log eventually, still useful now
            return url;
        };
    }

}
