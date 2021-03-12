import { Module } from '@nestjs/common';
import { ConfigModule } from 'protocol-common/config.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import data from '../config/env.json';
import { AgentManagerModule } from '../manager/agent.manager.module';
import { AgentRouterModule } from '../router/agent.router.module';
import { AgentControllerModule } from '../controller/agent.controller.module';
import { MultitenantModule } from '../multitenant/mutlitenant.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'protocol-common/logging.interceptor';

/**
 * Initializes the Nest application
 */
@Module({
    imports: [
        ConfigModule.init(data),
        AgentManagerModule,
        AgentRouterModule,
        AgentControllerModule,
        MultitenantModule,
    ],
    controllers: [AppController],
    providers: [
        AppService,
        {
            provide: APP_INTERCEPTOR,
            useClass: LoggingInterceptor
        }
    ],
})
export class AppModule {}
