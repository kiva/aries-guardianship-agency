import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppService } from './app.service.js';
import { AppController } from './app.controller.js';
import { OrmConfig } from '../ormconfig.js';
import { AgentManagerModule } from '../manager/agent.manager.module.js';
import { AgentRouterModule } from '../router/agent.router.module.js';
import { AgentControllerModule } from '../controller/agent.controller.module.js';
import { MultitenantModule } from '../multitenant/mutlitenant.module.js';
import { TransactionModule } from '../transactions/transaction.module.js';
import { PersistenceModule } from '../transactions/persistence/persistence.module.js';
import { TransactionMessagingModule } from '../transactions/messaging/transaction.messaging.module.js';
import { ConfigModule, LoggingInterceptor, ProtocolLoggerModule } from 'protocol-common';

// @ts-ignore: assertions are currently required when importing json: https://nodejs.org/docs/latest-v16.x/api/esm.html#json-modules
import data from '../config/env.json' assert { type: 'json'};

/**
 * Initializes the Nest application
 */
@Module({
    imports: [
        ConfigModule.init(data),
        OrmConfig(),
        ProtocolLoggerModule,
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
