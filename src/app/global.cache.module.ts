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
            let options;
            if (process.env.REDIS_ENABLED === 'true') {
                Logger.log('Using redis cache');
                options = {
                    store: redisStore,
                    host: process.env.REDIS_HOST,
                    auth_pass: process.env.REDIS_PASS,
                    port: '6379',
                    ttl: parseInt(process.env.DEFAULT_CACHE_TTL, 10),
                };
            } else {
                Logger.log('Using file system cache');
                options = {
                    store: fsStore,
                    path:'/tmp/diskcache',
                    ttl: parseInt(process.env.DEFAULT_CACHE_TTL, 10),
                    max: 1000
                };
            }
            return Promise.resolve(options);
        }
    })],
    exports: [CacheModule]
})
export class GlobalCacheModule {}
