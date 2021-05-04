import { Module, HttpModule, forwardRef } from '@nestjs/common';
import { AgentModule } from 'aries-controller/agent/agent.module';
import { AgentGovernanceFactory } from 'aries-controller/controller/agent.governance.factory';
import { AgentCaller} from 'aries-controller/agent/agent.caller';
import { GlobalCacheModule } from '../app/global.cache.module';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';

/**
 *
 */
@Module({
    imports: [
        AgentModule,
        HttpModule,
        GlobalCacheModule,
    ],
    controllers: [TransactionController],
    providers: [
        AgentGovernanceFactory,
        TransactionService,
        AgentCaller],
})
export class TransactionModule {}
