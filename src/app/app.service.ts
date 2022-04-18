import { Injectable, INestApplication } from '@nestjs/common';
import { json } from 'body-parser';
import { HttpConstants } from 'protocol-common/http-context/http.constants';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProtocolExceptionFilter } from 'protocol-common/protocol.exception.filter';
import { Logger } from 'protocol-common/logger';
import { DatadogLogger } from 'protocol-common/datadog.logger';
import { Constants } from 'protocol-common/constants';
import { traceware } from 'protocol-common/tracer';
import { ServiceReportDto } from './dtos/service.report.dto';

/**
 * All external traffic will be routed through gateway so no need for things like rate-limiting here
 */
@Injectable()
export class AppService {

    private static startedAt: Date;

    /**
     * Sets up app in a way that can be used by main.ts and e2e tests
     */
     public static async setup(app: INestApplication): Promise<void> {
        const logger = new Logger(DatadogLogger.getLogger());
        app.useLogger(logger);
        app.use(traceware(process.env.SERVICE_NAME));

        app.useGlobalFilters(new ProtocolExceptionFilter());

        // Increase json parse size to handle encoded images
        app.use(json({ limit: HttpConstants.JSON_LIMIT }));

        AppService.startedAt = new Date();

        if (process.env.NODE_ENV === Constants.LOCAL) {
            // Set up internal documentation at /api
            const options = new DocumentBuilder()
                .setTitle('Agency Service')
                .setDescription('Internal Documentation for the Agency microservice')
                .setVersion('1.0')
                .build();
            const document = SwaggerModule.createDocument(app, options);
            SwaggerModule.setup('api-docs', app, document);
        }
    }

    public generateStatsReport(): ServiceReportDto {
        const report: ServiceReportDto = new ServiceReportDto();
        report.serviceName = process.env.SERVICE_NAME;
        report.startedAt = AppService.startedAt.toDateString();
        report.currentTime = new Date().toDateString();
        report.versions = [ 'none'];

        // TODO: once we determine which items we want to check versions on
        // TODO: we will add the version checks here
        return report;
    }
}
