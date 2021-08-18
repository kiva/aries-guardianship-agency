import { HttpService, Injectable } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { AgentService } from 'aries-controller/agent/agent.service';
import { IBasicMessageHandler } from './basic.message.handler';
import { TransactionMessageTypesEnum } from './transaction.message.types.enum';
import { GrantMessageHandler } from './grant.message.handler';
import { TransactionMessageHandler } from './transaction.message.handler';
import { ReportMessageHandler } from './report.message.handler';
import { DataService } from '../persistence/data.service';


@Injectable()
export class TransactionMessageResponseFactory {
    constructor(private readonly dataService: DataService) {
    }

    /**
     * All transaction basic messages have a messageTypeId which identifies the message type--its is the message type
     * that determines the structure of the message.  Different classes process the different messages
     * @param agentId
     * @param adminApiKey
     * @param connectionId
     * @param messageTypeId
     */
    public getMessageHandler(agentService: AgentService,
                             agentId: string,
                             adminApiKey: string,
                             connectionId: string,
                             messageTypeId: string): IBasicMessageHandler {
        Logger.debug(`processing BasicMessage.messageTypeId of ${messageTypeId} `);
        switch (messageTypeId) {
            case TransactionMessageTypesEnum.GRANT:
                return new GrantMessageHandler(agentId);
            case TransactionMessageTypesEnum.CREDIT_TRANSACTION:
                return new TransactionMessageHandler(agentService, agentId, connectionId, this.dataService);
            case TransactionMessageTypesEnum.TRANSACTION_REQUEST:
                return new ReportMessageHandler(agentService, agentId, connectionId, this.dataService);
            default:
                Logger.warn(`BasicMessage.messageTypeId of ${messageTypeId} not recognized.`);
                break;
        }
        return undefined;
    }
}
