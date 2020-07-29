import { AxiosRequestConfig } from 'axios';
import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { IAgentResponseHandler } from './agent.response.handler';
import { AgentGovernance } from '../agent.governance';
import { CacheStore } from '@nestjs/common';

/*
    Acapy webhooks handler for input received from the url [webhookurl]/v1/controller/topic/connections
 */
export class Connections implements IAgentResponseHandler {
    private static CONNECTIONS_URL: string = 'connections';
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
        topic will be "connections"
    */
    public async handlePost(agentUrl: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any> {
        const delay = (ms: number) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };

        if (route !== 'topic' || topic !== 'connections') {
            throw new ProtocolException('Connections',`${route}/${topic} is not valid.`);
        }

        // REMOVE/COMMENT OUT TO Test webhook code below
        Logger.info(`nothing to do for route/topic: ${route}/${topic}`);
        return;

        // if (AgentGovernance.PERMISSION_DENY === this.agentGovernance.getPermission("connections", "accept-invitation")) {
        //     throw new ProtocolException('AgencyGovernance',`${topic} governance doesnt not allow.`);
        // }

        // if the agentUrl is in the cache then the agent has already accepted the request
        // if (this.cache.get<any>(agentUrl)) {
        //     return;
        // }

        // this webhook message indicates an agent received an connection
        // invitation and we want to tell them to accept it, if the policy allows
        if (body.state === 'invitation' && body.initiator === 'external') {
            Logger.info(`will requesting agent to accept connection invite`);
            await delay(2000);

            let url: string = agentUrl + `/${Connections.CONNECTIONS_URL}/${body.connection_id}/accept-request`;
            const req: AxiosRequestConfig = {
                method: 'POST',
                url,
                headers: {
                    'x-api-key': adminApiKey,
                }
            };

            Logger.info(`requesting agent to accept connection invite ${req.url}`);
            const res = await this.http.requestWithRetry(req);
            return res;
        }


        Logger.info(`nothing to do for route/topic: ${route}/${topic}`);
        return;
    }
}
