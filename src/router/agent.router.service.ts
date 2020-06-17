import { Injectable, HttpService, CacheStore, Inject, CACHE_MANAGER } from '@nestjs/common';
import { ProtocolHttpService } from '@kiva/protocol-common/protocol.http.service';
import { Logger } from '@kiva/protocol-common/logger';

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

    public getRouter() {
        return async (req) => {
            const parts = req.path.split('/');
            const agentId = parts[3];
            const url = await this.getUrl(agentId);
            Logger.log('Router proxy to ', url); // TODO remove this log eventually, still useful now
            return url;
        }
    }

}
