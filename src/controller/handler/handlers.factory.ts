import { ProtocolException } from 'protocol-common/protocol.exception';
import { IAgentResponseHandler } from './agent.response.handler';
import { Connections } from './connections';
import { AgentGovernance } from '../agent.governance';
import { Proofs } from './proof';
import {CacheStore} from "@nestjs/common";

/*
    @TODO we want to replace this factory with nestjs injection at some point
 */
export class HandlersFactory {
    /*

     */
    public static getHandler(agentGovernance: AgentGovernance, topic: string, cache: CacheStore): IAgentResponseHandler {
        switch (topic) {
            case 'connections':
                return new Connections(agentGovernance, cache);
            case 'proofs':
                return new Proofs(agentGovernance, cache);
            default:
                break;
        }
        throw new ProtocolException('Agency', 'No suitable handler found for topic');
    }
}
