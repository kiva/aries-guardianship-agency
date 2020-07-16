import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { NotImplementedException } from "@nestjs/common";
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { IAgentResponseHandler } from './agent.response.handler';
import { AgentGovernance } from '../agent.governance';

export class Connections implements IAgentResponseHandler {
    private static CONNECTIONS_URL: string = 'connections';
    private readonly http: ProtocolHttpService;
    constructor(private readonly agentGovernance: AgentGovernance) {
    }

    public async handleGet(agentUrl: string, adminApiKey: string, route: string, topic: string): Promise<any> {
        throw new NotImplementedException();
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
        topic will be "connections"
    */
    public async handlePost(agentUrl: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any> {

        /*
            TODO: to accept an invitation, some other process will do these steps
                1 - get a connection invitation
                2 - pass invitation to second agent
             From there, we can
                1 - tell one agent to accept (trick is which one)
                2 - then tell the other agent to accept

         */

        Logger.log(`...processing ${body.state}`, body);

        let url: string = agentUrl + `/${Connections.CONNECTIONS_URL}/`;

        const req: AxiosRequestConfig = {
            method: 'POST',
            url,
            headers: {
                'x-api-key': adminApiKey,
            },
            data: body.message
        };

        Logger.log(`...calling ${req.url}`);
        const res = await this.http.requestWithRetry(req);
        // have to return actual API results so that client can process it
        return res;
    }
}
