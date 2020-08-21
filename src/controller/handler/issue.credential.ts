import { Logger } from 'protocol-common/logger';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { IAgentResponseHandler } from './agent.response.handler';
import { AgentGovernance } from '../agent.governance';
import { CacheStore } from '@nestjs/common';
import { AxiosRequestConfig } from "axios";

/*
    Acapy webhooks handler for input received from the url [webhookurl]/v1/controller/topic/connections
 */
export class IssueCredential implements IAgentResponseHandler {
    private static ISSUE_CREDENTIALS_URL: string = 'issue-credential';
    constructor(private readonly agentGovernance: AgentGovernance, private readonly http: ProtocolHttpService, private readonly cache: CacheStore) {
    }

    private async checkPolicyForAction(governanceKey: string, cacheKey: string) {
        const permissionState = this.agentGovernance.peekPermission(IssueCredential.ISSUE_CREDENTIALS_URL, governanceKey);
        if (AgentGovernance.PERMISSION_DENY === permissionState) {
            throw new ProtocolException('AgencyGovernance',`${governanceKey} governance doesnt not allow.`);
        }

        // if the cacheKey is in the cache then the agent has already accepted the request
        // when we only allow once, there is no need to continue with this message
        if (await this.cache.get<any>(cacheKey) && permissionState === AgentGovernance.PERMISSION_ONCE) {
            throw new ProtocolException('AgencyGovernance',`${governanceKey} governance has already been used.`);
        }
    }

    /*
        body is expected to be like this
        {
           "credential_proposal_dict":{
           },
           "role":"holder",
           "initiator":"external",
           "thread_id":"ae318258-efbd-4928-ba19-16c4493af8c9",
           "credential_offer":{
           },
           "auto_issue":false,
           "trace":false,
           "connection_id":"a4ec2a76-9bc8-41af-857d-e7117fcb82d5",
           "updated_at":"2020-08-20 18:54:26.424447Z",
           "credential_definition_id":"Th7MpTaRZVRYnPiabds81Y:3:CL:12:issued_1",
           "state":"offer_received",
           "auto_offer":false,
           "auto_remove":true,
           "credential_exchange_id":"5a662281-7828-4085-9de8-06b6210c36b7",
           "created_at":"2020-08-20 18:54:26.424447Z",
           "schema_id":"Th7MpTaRZVRYnPiabds81Y:2:sample_schema:1.0"
        }

        for this handler, this will always be true:
        Route will be "topic"
        topic will be "issue_credential"
    */
    public async handlePost(agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any> {
        if (route !== 'topic' || topic !== 'issue_credential') {
            throw new ProtocolException('issue_credential',`${route}/${topic} is not valid.`);
        }

        const delay = (ms: number) => {
            return new Promise(resolve => setTimeout(resolve, ms));
        };
        const readPermission = async (governanceKey: string, cacheKey: string) => {
            this.agentGovernance.readPermission(IssueCredential.ISSUE_CREDENTIALS_URL, governanceKey);
            await this.cache.set(cacheKey, {});
        };

        if (body.role === 'holder' && body.state === 'offer_received') {
            const action = 'store';
            const templatedCacheKey = `${agentId}-${body.role}-${body.credential_exchange_id}`;
            await this.checkPolicyForAction(action, templatedCacheKey);
            await readPermission(action, templatedCacheKey);

            await delay(2000);
            const url: string = agentUrl + `/${IssueCredential.ISSUE_CREDENTIALS_URL}/records/${body.credential_exchange_id}/${action}`;
            const req: AxiosRequestConfig = {
                method: 'POST',
                url,
                headers: {
                    'x-api-key': adminApiKey,
                }
            };
            Logger.info(`requesting holder to save credential ${req.url}`);
            const res = await this.http.requestWithRetry(req);
            return res.data;
        }

        Logger.info(`doing nothing for ${agentId}: route ${route}: topic ${topic}`);
        return;
    }
}
