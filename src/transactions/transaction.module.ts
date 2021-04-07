import { Module, HttpModule } from '@nestjs/common';
import { AgentModule } from 'aries-controller/agent/agent.module';
import { AgentGovernanceFactory } from 'aries-controller/controller/agent.governance.factory';
import { AgentCaller} from 'aries-controller/agent/agent.caller';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

/**
 *
 */
@Module({
    imports: [
        AgentModule,
        HttpModule
    ],
    controllers: [TransactionController],
    providers: [
        AgentGovernanceFactory,
        TransactionService,
        AgentCaller],
})
export class TransactionModule {}
