import { Body, Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentControllerService } from './agent.controller.service.js';

/**
 * This handles all the controller responses to our agents
 * TODO is the GET needed or does the agent only ever POST?
 * TODO will there every be more subroutes? or are there ever just 2
 * TODO are there ever params or only just the body?
 */
@Controller('v1/controller')
@ApiTags('controller')
export class AgentControllerController {

    constructor(private readonly agentControllerService: AgentControllerService) {}

    @Get(':agentId/:route/:subroute')
    async getController(
        @Param('agentId') agentId: string,
        @Param('route') route: string,
        @Param('subroute') subroute: string,
        @Body() body: any
    ): Promise<any> {
        Logger.log(`GET ${agentId}/${route}/${subroute}`);
        return await this.agentControllerService.handleRequest(agentId, route, subroute, body);
    }

    @Post(':agentId/:route/:subroute')
    async postController(
        @Param('agentId') agentId: string,
        @Param('route') route: string,
        @Param('subroute') subroute: string,
        @Body() body: any
    ): Promise<any> {
        // note letting handler log body as needed
        // toThink() maybe get rid of this log message all together since it can be handled else where
        Logger.log(`POST ${agentId}/${route}/${subroute}`);
        return await this.agentControllerService.handleRequest(agentId, route, subroute, body);
    }

}
