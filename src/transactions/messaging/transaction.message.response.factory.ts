import { HttpService, Injectable } from '@nestjs/common';
import { ProtocolHttpService } from 'protocol-common/protocol.http.service';
import { Logger } from 'protocol-common/logger';
import { IBasicMessageHandler } from './basic.message.handler';
import { TransactionMessageTypesEnum } from './transaction.message.types.enum';
import { GrantMessageHandler } from './grant.message.handler';
import { TransactionMessageHandler } from './transaction.message.handler';
import { ReportMessageHandler } from './report.message.handler';
import { DataService } from '../persistence/data.service';

@Injectable()
export class TransactionMessageResponseFactory {
    private readonly http: ProtocolHttpService;
    constructor(private readonly dataService: DataService, httpService: HttpService) {
        this.http = new ProtocolHttpService(httpService);
    }

    public getMessageHandler(agentId: string, adminApiKey: string, connectionId: string, messageTypeId: string,
                             dbAccessor: DataService): IBasicMessageHandler {
        Logger.debug(`processing BasicMessage.messageTypeId of ${messageTypeId} `);
        switch (messageTypeId) {
            case TransactionMessageTypesEnum.GRANT:
                return new GrantMessageHandler(agentId);
            case TransactionMessageTypesEnum.CREDIT_TRANSACTION:
                return new TransactionMessageHandler(agentId, adminApiKey, connectionId, dbAccessor, this.http);
            case TransactionMessageTypesEnum.TRANSACTION_REQUEST:
                return new ReportMessageHandler(agentId, adminApiKey, connectionId, dbAccessor, this.http);
            default:
                Logger.warn(`BasicMessage.messageTypeId of ${messageTypeId} not recognized.`);
                break;
        }
        return undefined;
    }
}
