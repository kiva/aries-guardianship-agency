import { Get, Controller } from '@nestjs/common';
import { HttpConstants } from '@kiva/protocol-common/http-context/http.constants';
import { AppService } from './app.service';

/**
 * Base route is just for various health check endpoints
 */
@Controller()
export class AppController {

    constructor(private readonly appService: AppService) {}

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
    @Get('genesis-file')
    async getGenesisFile(): Promise<string> {
        return AppService.getGenesisFile();
    }
}
