import { Injectable, Inject } from '@nestjs/common';
import { Logger } from 'protocol-common/logger';
import { AgentGovernance, ControllerCallback } from 'aries-controller/controller/agent.governance';
import { Topics } from 'aries-controller/controller/handler/topics';

@Injectable()
export class TransactionService {
    constructor(@Inject('AGENT_GOVERNANCE') private readonly agentGovernance: AgentGovernance
    ) {
        agentGovernance.registerHandler(Topics.BASIC_MESSAGES, this.basicMessageHandler);
    }

    /**
     * receives basicmessage notifications and will respond in kind to fsp basic messages received from the TDC
     * @param agentUrl
     * @param agentId
     * @param adminApiKey
     * @param route
     * @param topic
     * @param body
     * @param token
     */
    public basicMessageHandler: ControllerCallback =
        async (agentUrl: string, agentId: string, adminApiKey: string, route: string, topic: string, body: any, token?: string):
            Promise<any> => {
            Logger.debug(`Fsp TransactionService received basic message`, body);
            switch (body.messageTypeId) {
                case `grant`:
                    if (body.state === `completed`) {
                        // todo we need to determine database schema for storing and logic for responding to basicmessages
                        Logger.info(`received completed grant information.`);
                        // todo and send ack to TDC once the endpoints are setup and save connection information
                    }
                    break;
            }

            return undefined;
        }
}
