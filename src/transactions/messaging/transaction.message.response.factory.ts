import { Injectable } from '@nestjs/common';
import { ITransactionMessageResponse } from './transaction.message.response';

@Injectable()
export class TransactionMessageResponseFactory {
    public getMessageHandler(): ITransactionMessageResponse {
        return undefined;
    }
}
