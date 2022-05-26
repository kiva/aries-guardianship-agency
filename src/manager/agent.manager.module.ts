import { Module } from '@nestjs/common';
import { AgentManagerService } from './agent.manager.service.js';
import { AgentManagerController } from './agent.manager.controller.js';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { ProtocolHttpModule } from 'protocol-common';

/**
 * Manages spinning up and down agents
 */
@Module({
    imports: [
        GlobalCacheModule,
        ProtocolHttpModule,
    ],
    controllers: [AgentManagerController],
    providers: [AgentManagerService],
})
export class AgentManagerModule {}
