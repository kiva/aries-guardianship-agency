import { Injectable } from '@nestjs/common';
import { ITransactionMessageResponse } from './transaction.message.response';
import { TransactionMessageTypesEnum } from './transaction.message.types.enum';

@Injectable()
export class TransactionMessageResponseFactory {
    public getMessageHandler(messageTypeId: string): ITransactionMessageResponse {
        switch (messageTypeId) {
            case TransactionMessageTypesEnum.GRANT:
                break;
            case TransactionMessageTypesEnum.CREDIT_TRANSACTION:
                break;
            case TransactionMessageTypesEnum.TRANSACTION_REQUEST:
                break;
        }
        return undefined;
    }
}
