import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { IAgentResponseHandler } from './agent.response.handler';
import { AgentGovernance } from '../agent.governance';
import { CacheStore } from '@nestjs/common';

/*
    Acapy webhooks handler for input received from the url [webhookurl]/v1/controller/topic/connections
 */
export class IssueCredential implements IAgentResponseHandler {
    private static CONNECTIONS_URL: string = 'connections';
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
    }

    /*
       TODO body is expected to be like this


        for this handler, this will always be true:
        Route will be "topic"
        topic will be "issue_credential"
    */
    public async handlePost(agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any> {
        if (route !== 'topic' || topic !== 'issue_credential') {
            throw new ProtocolException('issue_credential',`${route}/${topic} is not valid.`);
        }
        // TODO:
        Logger.info(`doing nothing for ${agentId}: route ${route}: topic ${topic}`);
        return;
    }
}
