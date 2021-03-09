import { HttpModule, Module } from '@nestjs/common';
import { GlobalCacheModule } from '../app/global.cache.module';
import { MultitenantService } from './mulittenant.service';
import { MultitenantController } from './multitenant.controller';

/**
 * Multitenant module
 */
@Module({
    imports: [
        GlobalCacheModule,
        HttpModule,
    ],
    controllers: [MultitenantController],
    providers: [MultitenantService],
})
export class MultitenantModule {}
