import { Module, HttpModule, HttpService } from '@nestjs/common';
import { AgentManagerService } from './agent.manager.service';
import { AgentManagerController } from './agent.manager.controller';
import { GlobalCacheModule } from '../app/global.cache.module';

/**
 * Manages spinning up and down agents
 */
@Module({
    imports: [
        GlobalCacheModule,
        HttpModule,
    ],
    controllers: [AgentManagerController],
    providers: [AgentManagerService],
})
export class AgentManagerModule {}
