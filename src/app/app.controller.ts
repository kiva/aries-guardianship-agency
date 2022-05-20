import { Get, Controller } from '@nestjs/common';
import { AgentConfig } from '../manager/agent.config.js';
import { AppService } from './app.service.js';
import { ServiceReportDto } from './dtos/service.report.dto.js';
import { DisableAutoLogging, EnableAutoLogging, HttpConstants } from 'protocol-common';

/**
 * Base route is just for various health check endpoints
 */
@DisableAutoLogging()
@Controller()
export class AppController {

    constructor(private readonly service: AppService) {
    }

    @Get()
    base(): string {
        return process.env.SERVICE_NAME;
    }

    @Get('ping')
    ping(): string {
        return HttpConstants.PING_RESPONSE;
    }

    @Get('healthz')
    healthz(): string {
        return HttpConstants.HEALTHZ_RESPONSE;
    }

    /**
     * This is strictly needed, but could be useful for external users
     */
    @EnableAutoLogging()
    @Get('genesis-file')
    getGenesisFile(): string {
        return AgentConfig.getGenesisFile();
    }

    /**
     * Called by the protocol-services-support service
     * for uptime statistics reporting "engine".
     */
    @Get('stats')
    generateStatsReport() : ServiceReportDto {
        return this.service.generateStatsReport();
    }

}
