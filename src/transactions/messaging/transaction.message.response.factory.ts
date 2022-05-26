import { Injectable, Logger } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common';
import { IBasicMessageHandler } from './basic.message.handler.js';
import { TransactionMessageTypesEnum } from './transaction.message.types.enum.js';
import { GrantMessageHandler } from './grant.message.handler.js';
import { TransactionMessageHandler } from './transaction.message.handler.js';
import { ReportMessageHandler } from './report.message.handler.js';
import { DataService } from '../persistence/data.service.js';
import { AgentService } from 'aries-controller';


@Injectable()
export class TransactionMessageResponseFactory {

    constructor(private readonly dataService: DataService, private readonly http: ProtocolHttpService) {}

    /**
     * All transaction basic messages have a messageTypeId which identifies the message type--its is the message type
     * that determines the structure of the message.  Different classes process the different messages
     *
     * @param agentService
     * @param agentId
     * @param adminApiKey
     * @param connectionId
     * @param messageTypeId
     */
    public getMessageHandler(
        agentService: AgentService,
        agentId: string,
        adminApiKey: string,
        connectionId: string,
        messageTypeId: string
    ): IBasicMessageHandler {
        Logger.debug(`processing BasicMessage.messageTypeId of ${messageTypeId} `);
        switch (messageTypeId) {
            case TransactionMessageTypesEnum.GRANT:
                return new GrantMessageHandler(agentId);
            case TransactionMessageTypesEnum.CREDIT_TRANSACTION:
                return new TransactionMessageHandler(agentService, agentId, adminApiKey, connectionId, this.dataService, this.http);
            case TransactionMessageTypesEnum.TRANSACTION_REQUEST:
                return new ReportMessageHandler(agentService, agentId, adminApiKey, connectionId, this.dataService, this.http);
            default:
                Logger.warn(`BasicMessage.messageTypeId of ${messageTypeId} not recognized.`);
                break;
        }
        return undefined;
    }
}
