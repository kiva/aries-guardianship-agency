import { Module } from '@nestjs/common';
import { ProtocolService } from './protocol.service';
import { ProtocolController } from './protocol.controller';

/**
 * Manages spinning up and down agents
 */
@Module({
    imports: [],
    controllers: [ProtocolController],
    providers: [ProtocolService],
})
export class AgentManagerModule {}
