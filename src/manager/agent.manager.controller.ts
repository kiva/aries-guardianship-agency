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
     * TODO ignoring the linting errors for now, need to fix eventually - perhaps by passing the full DTO object
     */
    @Post()
    public createAgent(@Body() body: any) {
        return this.agentManagerService.spinUpAgent(body.walletId, body.walletKey, body.adminApiKey, body.ttl, body.seed, body.controllerUrl, body.alias, body.autoConnect);
    }

    /**
     * TODO DTOs
     */
    @Delete()
    public stopAgent(@Body() body: any) {
        return this.agentManagerService.spinDownAgent(body.agentId);
    }
}
