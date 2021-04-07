import { Controller, Body, Post, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentManagerService } from './agent.manager.service';
import { ProtocolValidationPipe } from 'protocol-common/validation/protocol.validation.pipe';
import { AgentCreateDto } from './dtos/agent.create.dto';

/**
 * Endpoints to spin up and down agents
 */
@Controller('v1/manager')
@ApiTags('manager')
export class AgentManagerController {

    constructor(private readonly agentManagerService: AgentManagerService) {}

    /**
     * Spin up an agent with the passed in params
     */
    @Post()
    public createAgent(@Body(new ProtocolValidationPipe()) body: AgentCreateDto) {
        return this.agentManagerService.spinUpAgent(body);
    }

    /**
     * TODO DTOs
     */
    @Delete()
    public stopAgent(@Body() body: any) {
        return this.agentManagerService.spinDownAgent(body.agentId);
    }

    /**
     * Make a separate call to connect with the agent
     */
    @Post('connect')
    public connectAgent(@Body() body: any) {
        return this.agentManagerService.connectAgent(body.agentId, body.adminApiKey);
    }
}
