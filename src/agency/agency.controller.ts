import { Controller, Post, Body} from '@nestjs/common';
import { ProtocolValidationPipe } from '@kiva/protocol-common/protocol.validation.pipe';
import { AgencyOpenAgentDto } from './dtos/agency.open-agent.dto';
import { AgentManagerService } from '../manager/agent.manager.service';

/*
    API endpoint for activating agency
    Agency is responsible for determining if/when/how
    to pass call to an agent
*/
@Controller('v1/agency')
export class AgencyController {
    private manager: AgentManagerService;

    constructor(manager: AgentManagerService) {
        this.manager = manager;
    }

    @Post()
    async openAgent(@Body(new ProtocolValidationPipe())  openAgent: AgencyOpenAgentDto) {
        // TODO: validation
        // TODO: call agent manager
        throw new Error('not implemented yet');
    }
}
