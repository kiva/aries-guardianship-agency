import { Module } from '@nestjs/common';
import { AgentModule } from 'aries-controller/agent/agent.module';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { AgentGovernanceFactory } from 'aries-controller/controller/agent.governance.factory';

/**
 *
 */
@Module({
    imports: [
        AgentModule
    ],
    controllers: [TransactionController],
    providers: [AgentGovernanceFactory, TransactionService],
})
export class TransactionModule {}
