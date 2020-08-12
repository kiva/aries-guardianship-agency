import { CacheStore } from '@nestjs/common';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { Logger } from 'protocol-common/logger';
import { IAgentResponseHandler } from './agent.response.handler';
import { Connections } from './connections';
import { AgentGovernance } from '../agent.governance';
import { Proofs } from './proof';
import { IssueCredential } from './issue.credential';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';

/*
    @TODO we want to replace this factory with nestjs injection at some point
 */
export class HandlersFactory {
    /*

     */
    public static getHandler(agentGovernance: AgentGovernance, topic: string, http: ProtocolHttpService, cache: CacheStore): IAgentResponseHandler {
        Logger.warn(`looking for handler topic ${topic}`);
        switch (topic) {
            case 'connections':
                return new Connections(agentGovernance, http, cache);
            case 'proofs':
                return new Proofs(agentGovernance, http, cache);
            case 'issue_credential':
                return new IssueCredential(agentGovernance, http, cache);
            default:
                Logger.warn(`unhandled topic ${topic}`);
                break;
        }
        throw new ProtocolException('Agency', `No suitable handler found for topic ${topic}`);
    }
}
