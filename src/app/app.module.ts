import { Module } from '@nestjs/common';
import { ConfigModule } from '@kiva/protocol-common/config.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import data from '../config/env.json';
import { AgentManagerModule } from '../manager/agent.manager.module';
import { AgentRouterModule } from '../router/agent.router.module';
import { AgentControllerModule } from '../controller/agent.controller.module';

/**
 * Initializes the Nest application
 */
@Module({
    imports: [
        ConfigModule.init(data),
        AgentManagerModule,
        AgentRouterModule,
        AgentControllerModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
