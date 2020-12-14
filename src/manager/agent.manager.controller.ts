import { Controller, Body, Post, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentManagerService } from './agent.manager.service';
import { ProtocolValidationPipe } from 'protocol-common/protocol.validation.pipe';
import { AgentCreateDto } from './dtos/agent.create.dto';

/**
 *
 */
@Controller('v1/manager')
@ApiTags('manager')
export class AgentManagerController {

    constructor(private readonly agentManagerService: AgentManagerService) {}

    /**
     * TODO ignoring the linting errors for now, need to fix eventually - perhaps by passing the full DTO object
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
