import { CacheStore } from '@nestjs/common';
import { ProtocolException } from 'protocol-common/protocol.exception';
import { Logger } from 'protocol-common/logger';
import { IAgentResponseHandler } from './agent.response.handler';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Connections } from './connections';
import { AgentGovernance } from '../agent.governance';
import { Proofs } from './proof';
import { IssueCredential } from './issue.credential';
import { ProblemReport } from './problem.report';

/*
    @TODO we want to replace this factory with nestjs injection at some point
 */
export class HandlersFactory {
    /*

     */
    public static getHandler(agentGovernance: AgentGovernance, topic: string, http: ProtocolHttpService, cache: CacheStore): IAgentResponseHandler {
        switch (topic) {
            case 'connections':
                return new Connections(agentGovernance, http, cache);
            case 'present_proof':
                return new Proofs(agentGovernance, http, cache);
            case 'issue_credential':
                return new IssueCredential(agentGovernance, http, cache);
            case 'problem_report':
                return new ProblemReport(agentGovernance, http, cache);
            default:
                Logger.warn(`unhandled topic ${topic}`);
                break;
        }
        throw new ProtocolException('Agency', `No suitable handler found for topic ${topic}`);
    }
}
