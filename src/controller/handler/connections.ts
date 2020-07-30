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

    private checkPolicyForAction(governanceKey: string, cacheKey: string) {
        const permissionState = this.agentGovernance.peekPermission(Connections.CONNECTIONS_URL, governanceKey);

        if (AgentGovernance.PERMISSION_DENY === permissionState) {
            throw new ProtocolException('AgencyGovernance',`${governanceKey} governance doesnt not allow.`);
        }

        // if the cacheKey is in the cache then the agent has already accepted the request
        // when we only allow once, there is no need to continue with this message
        if (this.cache.get<any>(cacheKey) && permissionState === AgentGovernance.PERMISSION_ONCE) {
            throw new ProtocolException('AgencyGovernance',`${governanceKey} governance has already been used.`);
        }
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
    public async handlePost(agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any> {
        const delay = (ms: number) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };
        const readPermission = (governanceKey: string, cacheKey: string) => {
            this.agentGovernance.readPermission('connections', governanceKey);
            this.cache.set(cacheKey, {});
        }

        if (route !== 'topic' || topic !== 'connections') {
            throw new ProtocolException('Connections',`${route}/${topic} is not valid.`);
        }

        const cacheKey = `${agentId}-${body.state}-${body.initiator}`;

        // this webhook message indicates an agent received an connection
        // invitation and we want to tell them to accept it, if the policy allows
        if (body.state === 'invitation' && body.initiator === 'external') {
            const action = 'accept-invitation';
            this.checkPolicyForAction(action, cacheKey);
            readPermission(action, cacheKey);

            let url: string = agentUrl + `/${Connections.CONNECTIONS_URL}/${body.connection_id}/${action}`;
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

        // this webhook message indicates the receiving agent has accepted the invite and now
        // we need to instruct this agent to finish the steps of a connection
        if (body.state === 'request' && body.initiator === 'self') {
            const action = 'accept-request';
            this.checkPolicyForAction(action, cacheKey);
            readPermission(action, cacheKey);
            // at this point, the other participant in this conversation hasn't caught up with
            // everything, so we hold our horses for a moment
            await delay(2000);

            let url: string = agentUrl + `/${Connections.CONNECTIONS_URL}/${body.connection_id}/${action}`;
            const req: AxiosRequestConfig = {
                method: 'POST',
                url,
                headers: {
                    'x-api-key': adminApiKey,
                }
            };

            Logger.info(`requesting initiating agent to complete connection invite ${req.url}`);
            const res = await this.http.requestWithRetry(req);
            return res;
        }


        Logger.info(`nothing to do for route/topic: ${route}/${topic}`);
        return;
    }
}
