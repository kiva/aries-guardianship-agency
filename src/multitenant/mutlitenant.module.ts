import { Module } from '@nestjs/common';
import { GlobalCacheModule } from '../app/global.cache.module.js';
import { MultitenantService } from './mulittenant.service.js';
import { MultitenantController } from './multitenant.controller.js';
import { ProtocolHttpModule } from 'protocol-common';

/**
 * Multitenant module
 */
@Module({
    imports: [
        GlobalCacheModule,
        ProtocolHttpModule,
    ],
    controllers: [MultitenantController],
    providers: [MultitenantService],
})
export class MultitenantModule {}
