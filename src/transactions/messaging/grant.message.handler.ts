import { IBasicMessageHandler } from './basic.message.handler.js';
import { TransactionMessageStatesEnum } from './transaction.message.states.enum.js';
import { Logger } from '@nestjs/common';


export class GrantMessageHandler implements IBasicMessageHandler {
    constructor(private readonly agentId: string) {
    }

    public async respond(message: any): Promise<boolean> {
        if (message.state === TransactionMessageStatesEnum.COMPLETED) {
            Logger.log(`received completed grant information for agent ${this.agentId}.`);
            // TODO do we need to send ack to TDC once the endpoints are setup and save connection information
        }
        return false;
    }

}
