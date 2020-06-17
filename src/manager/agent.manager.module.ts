import { Module } from '@nestjs/common';
import { AgentManagerService } from './agent.manager.service';
import { AgentManagerController } from './agent.manager.controller';
import { GlobalCacheModule } from '../app/global.cache.module';

/**
 * Manages spinning up and down agents
 */
@Module({
    imports: [GlobalCacheModule],
    controllers: [AgentManagerController],
    providers: [AgentManagerService],
})
export class AgentManagerModule {}
