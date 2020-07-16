import { Injectable, HttpService, Inject, CACHE_MANAGER, CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { AxiosRequestConfig } from 'axios';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { Logger } from 'protocol-common/logger';
import { AgentGovernance } from './agent.governance';
import { HandlersFactory } from './handler/handlers.factory';

/**
 * Agent acting on the behalf of a "citizen"
 *
 * TODO this needs to handle general requests that come from the agents for the controller to handle -
 * it should have some way of checking what it's behavior should be and respond accordingly
 */
@Injectable()
export class AgentControllerService {

    private readonly http: ProtocolHttpService;
    private readonly agentGovernance: AgentGovernance;
    constructor(
        httpService: HttpService,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore) {
        this.http = new ProtocolHttpService(httpService);
        // TODO: the input to the constructor needs to come from something else
        this.agentGovernance = new AgentGovernance('permissive');
    }

    async handleRequest(agentId: string, route: string, topic: string, body: any) {
        Logger.info(`AgentControllerService.handleRequest(${agentId}, ${route}, ${topic})`, body);
        const agent: any = await this.cache.get(agentId);
        const agentUrl = `http://${agentId}:${agent.adminPort}`;

        return HandlersFactory.getHandler(this.agentGovernance, topic).handlePost(agentUrl, agent.adminApiKey, route, topic, body);
    }
}
