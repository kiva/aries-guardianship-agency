import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from 'protocol-common/logging.interceptor';
import { ConfigModule } from 'protocol-common/config.module';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import data from '../config/env.json';
import { OrmConfig } from '../ormconfig';
import { AgentManagerModule } from '../manager/agent.manager.module';
import { AgentRouterModule } from '../router/agent.router.module';
import { AgentControllerModule } from '../controller/agent.controller.module';
import { MultitenantModule } from '../multitenant/mutlitenant.module';
import { TransactionModule } from '../transactions/transaction.module';
import { PersistenceModule } from '../transactions/persistence/persistence.module';
import { TransactionMessagingModule } from '../transactions/messaging/transaction.messaging.module';

/**
 * Initializes the Nest application
 */
@Module({
    imports: [
        ConfigModule.init(data),
        OrmConfig(),
        AgentManagerModule,
        AgentRouterModule,
        AgentControllerModule,
        MultitenantModule,
        TransactionModule,
        PersistenceModule,
        TransactionMessagingModule
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
