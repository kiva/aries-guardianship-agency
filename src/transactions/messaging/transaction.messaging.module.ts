import { Module } from '@nestjs/common';
import { TransactionMessageResponseFactory } from './transaction.message.response.factory.js';
import { DataService } from '../persistence/data.service.js';
import { ProtocolHttpModule } from 'protocol-common';
import { AgentModule } from 'aries-controller';


/**
 *
 */
@Module({
    imports: [
        AgentModule,
        ProtocolHttpModule,
    ],
    providers: [
        TransactionMessageResponseFactory,
        DataService
    ],
    exports: [TransactionMessageResponseFactory]
})
export class TransactionMessagingModule {}
