import { Global, Module, CacheModule, Logger } from '@nestjs/common';
import * as fsStore from 'cache-manager-fs-hash';
import * as redisStore from 'cache-manager-redis-store';

/**
 * Supports both a redis cache in our deployed environments, and a file system cache for local testing
 */
@Global()
@Module({
    imports: [CacheModule.registerAsync({
        useFactory: () => {
            if (process.env.REDIS_ENABLED === 'true') {
                Logger.log('Using redis cache');
                return {
                    store: redisStore,
                    host: process.env.REDIS_HOST,
                    auth_pass: process.env.REDIS_PASS,
                    port: 6379,
                    ttl: 0
                };
            } else {
                Logger.log('Using file system cache');
                return {
                    store: fsStore,
                    path:'/tmp/diskcache',
                    ttl: parseInt(process.env.DEFAULT_CACHE_TTL, 10),
                    max: 1000
                };
            }
        }
    })],
    exports: [CacheModule]
})
export class GlobalCacheModule {}