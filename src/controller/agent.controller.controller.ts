import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgentControllerService } from './agent.controller.service';
import { Logger } from 'protocol-common/logger';

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
        const value = await this.agentControllerService.handleRequest(agentId, route, subroute, body);
        return value;
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
        const value = await this.agentControllerService.handleRequest(agentId, route, subroute, body);
        return value;
    }

}
