import { Module } from '@nestjs/common';
import { DataService } from './data.service.js';

@Module({
    imports: [DataService],
    exports: [DataService],
    controllers: [],
    providers: [DataService],
})
export class PersistenceModule {}
