import { Injectable, HttpService, Inject, CACHE_MANAGER, CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { AgentGovernance } from './agent.governance';
import { HandlersFactory } from './handler/handlers.factory';

/**
 * Agent acting on the behalf of a "citizen" or credential holder
 *
 */
@Injectable()
export class AgentControllerService {

    private readonly http: ProtocolHttpService;

    constructor(
        httpService: HttpService,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
        @Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance) {
        this.http = new ProtocolHttpService(httpService);
    }

    async handleRequest(agentId: string, route: string, topic: string, body: any) {
        Logger.info(`AgentControllerService.handleRequest(${agentId}, ${route}, ${topic})`);
        const agent: any = await this.cache.get(agentId);
        // @tothink http/https?  should this be from the env?
        const agentUrl = `http://${agentId}:${process.env.AGENT_ADMIN_PORT}`;

        return await HandlersFactory.getHandler(this.agentGovernance, topic, this.http, this.cache)
            .handlePost(agentUrl, agentId, agent.adminApiKey, route, topic, body);
    }
}

