import { Global, Module, CacheModule } from '@nestjs/common';
import * as fsStore from 'cache-manager-fs-hash';

/**
 * TODO right now we're using a file system cache for simplicity, at some point we should switch to redis or something
 * TODO we'll probably remove the cache entirely soon
 */
@Global()
@Module({
    imports: [CacheModule.register({
        store: fsStore,
        path:'/tmp/diskcache',
        ttl: 31536000, // one year
        max: 1000
    })],
    exports: [CacheModule]
})
export class GlobalCacheModule {}