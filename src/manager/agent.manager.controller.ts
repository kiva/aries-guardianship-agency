import { Controller, Body, Post, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentManagerService } from './agent.manager.service';

/**
 *
 */
@Controller('v1/manager')
@ApiTags('manager')
export class AgentManagerController {

    constructor(private readonly agentManagerService: AgentManagerService) {}

    /**
     * TODO use the DTOs from the agency folder
     */
    @Post()
    public createAgent(@Body() body: any) {
        return this.agentManagerService.spinUpAgent(body.walletId, body.walletKey, body.adminApiKey, body.ttl);
    }

    /**
     * TODO DTOs
     */
    @Delete()
    public stopAgent(@Body() body: any) {
        return this.agentManagerService.spinDownAgent(body.agentId);
    }
}
