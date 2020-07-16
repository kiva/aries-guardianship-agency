import { NotImplementedException } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { IAgentResponseHandler } from './agent.response.handler';
import { AgentGovernance } from '../agent.governance';
import {AxiosRequestConfig} from "axios";

export class Proofs implements IAgentResponseHandler {
    private static PROOFS_URL: string = 'proofs';
    private readonly http: ProtocolHttpService;

    constructor(private readonly agentGovernance: AgentGovernance) {
    }

    public async handleGet(agentUrl: string, adminApiKey: string, route: string, topic: string): Promise<any> {
        throw new NotImplementedException();
    }

    /*
        body json object, two requirements
           message: json object, must match Aries ACAPY inputs for given call

       TODO: would be nice if consumer didn't need to know how to format messages for Aries ACAPY
     */
    public async handlePost(agentUrl: string, adminApiKey: string, route: string, topic: string, body: any): Promise<any> {
        if (body.initiator === 'self') {
            Logger.log('self initiated request, nothing to handle');
            return;
        }

        let finalRoute: string = '';
        let url: string = agentUrl + `/${Proofs.PROOFS_URL}`;
        // for documnetation purposes the following were referenced:
        // acapy/aries_cloudagent/protocols/issue_credential/v1_0/models/credential_exchange.py
        // and  acapy/aries_cloudagent/protocols/issue_credential/v1_0/manager.py
        // and  acapy/aries_cloudagent/protocols/issue_credential/v1_0/routes.py
        switch (topic) {
            case 'proposal_sent':
            case 'proposal_received':
            case 'offer_sent':
            case 'offer_received':
            case 'request_sent':
            case 'request_received':
            case 'credential_issued':
            case 'credential_received':
            case 'credential_acked':
            default:
                throw new ProtocolException('Unknown', `Unknown topic for 'proof' ${topic}`);
                break;
        }

        // url: string = agentUrl + `/${Proofs.PROOFS_URL}/${body.connection_id}/${finalRoute}`;
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
        return 'success'; // TODO should we just return success? or something else?
    }
}
