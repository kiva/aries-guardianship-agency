import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentRouterService } from './agent.router.service';

/**
 * TODO the routing is handled via http-proxy, so we may not need an explicit controller here
 */
@Controller('v1/router')
@ApiTags('router')
export class AgentRouterController {

    constructor(private readonly routerService: AgentRouterService) {}

}
