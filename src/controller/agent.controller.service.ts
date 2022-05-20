import { Injectable, Inject, CACHE_MANAGER, CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common';
import { AgentGovernance, HandlersFactory } from 'aries-controller';

/**
 * Agent acting on the behalf of a "citizen" or credential holder
 */
@Injectable()
export class AgentControllerService {

    constructor(
        private readonly http: ProtocolHttpService,
        @Inject(CACHE_MANAGER) private readonly cache: CacheStore,
        @Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance
    ) {}

    async handleRequest(agentId: string, route: string, topic: string, body: any) {
        const agent: any = await this.cache.get(agentId);
        let agentUrl = process.env.MULTITENANT_URL;
        if (!agent.multitenant) {
            const adminPort: string = (agent ? agent.adminApiPort : process.env.AGENT_ADMIN_PORT);
            // @tothink http/https?  should this be from the env?
            agentUrl = `http://${agentId}:${adminPort}`;
        }

        return await HandlersFactory.getHandler(this.agentGovernance, topic, this.http, this.cache)
            .handleAcapyWebhookMsg(agentUrl, agentId, agent.adminApiKey, route, topic, body, agent.token);
    }
}

