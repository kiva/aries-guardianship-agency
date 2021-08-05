import { HttpModule, Module } from '@nestjs/common';
import { AgentModule } from 'aries-controller/agent/agent.module';
import { TransactionMessageResponseFactory } from './transaction.message.response.factory';
import { DataService } from '../persistence/data.service';


/**
 *
 */
@Module({
    imports: [
        AgentModule,
        HttpModule,
    ],
    controllers: [],
    providers: [
        TransactionMessageResponseFactory,
        DataService],
    exports: [TransactionMessageResponseFactory]
})
export class TransactionMessagingModule {}
