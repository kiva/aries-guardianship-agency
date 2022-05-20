import { Module } from '@nestjs/common';
import { AgentModule, AgentGovernanceFactory } from 'aries-controller';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { TransactionController } from './transaction.controller.js';
import { TransactionService } from './transaction.service.js';
import { DataService } from './persistence/data.service.js';
import { TransactionMessageResponseFactory } from './messaging/transaction.message.response.factory.js';
import { ProtocolHttpModule } from 'protocol-common';

/**
 *
 */
@Module({
    imports: [
        AgentModule,
        ProtocolHttpModule,
        GlobalCacheModule,
    ],
    controllers: [TransactionController],
    providers: [
        AgentGovernanceFactory,
        TransactionService,
        DataService,
        TransactionMessageResponseFactory
    ],
})
export class TransactionModule {}
