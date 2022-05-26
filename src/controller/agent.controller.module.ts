import { Module } from '@nestjs/common';
import { AgentControllerService } from './agent.controller.service.js';
import { AgentControllerController } from './agent.controller.controller.js';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { ProtocolHttpModule } from 'protocol-common';
import { AgentGovernanceFactory } from 'aries-controller';

/**
 * The controller module for our agency, handles all the callbacks and webhooks from our agents
 */
@Module({
    imports: [
        ProtocolHttpModule,
        GlobalCacheModule,
    ],
    controllers: [AgentControllerController],
    providers: [AgentControllerService, AgentGovernanceFactory],
})
export class AgentControllerModule {}
