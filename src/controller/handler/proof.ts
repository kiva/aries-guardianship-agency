import { CacheStore } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { IAgentResponseHandler } from './agent.response.handler';
import { AgentGovernance } from '../agent.governance';

export class Proofs implements IAgentResponseHandler {
    private static PROOFS_URL: string = 'proofs';

    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
    }

    /*
       body is expected to be like this
       {
           "routing_state":"none",
           "their_label":"Aries Cloud Agent",
           "alias":"For-Meditor",
           "my_did":"Yad6847oyTWq7du8qeEFe9",
           "accept":"manual",
           "updated_at":"2020-07-16 14:36:45.759114Z",
           "created_at":"2020-07-16 14:36:01.286531Z",
           "invitation_key":"62zG2GJEKuY5BTRLjAt9U5YFWchJex2KnDPSf7D92adT",
           "connection_id":"ddbf57a4-e801-4f70-b508-a91383155476",
           "request_id":"d898835e-9b3d-4cca-be70-724a0b1a083a",
           "state":"request",
           "initiator":"external",
           "invitation_mode":"once"
        }

        for this handler, this will always be true:
        Route will be "topic"
        topic will be "????"
     */
    public async handlePost(agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any> {
        // TODO:
        Logger.info(`doing nothing for ${agentId}: route ${route}: topic ${topic}`);
        return;
    }
}
