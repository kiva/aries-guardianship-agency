import { Get, Controller } from '@nestjs/common';
import { HttpConstants } from 'protocol-common/http-context/http.constants';
import { AgentConfig } from '../manager/agent.config';
import { DisableAutoLogging } from 'protocol-common/disable.auto.logging.decorator';
import { EnableAutoLogging } from 'protocol-common/enable.auto.logging.decorator';

/**
 * Base route is just for various health check endpoints
 */
@DisableAutoLogging()
@Controller()
export class AppController {

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
}
