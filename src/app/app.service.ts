import { Injectable, INestApplication } from '@nestjs/common';
import bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ServiceReportDto } from './dtos/service.report.dto.js';
import { Constants, HttpConstants, ProtocolExceptionFilter, ProtocolLogger, traceware } from 'protocol-common';

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
        app.useLogger(app.get(ProtocolLogger));
        app.use(traceware(process.env.SERVICE_NAME));

        app.useGlobalFilters(new ProtocolExceptionFilter());

        // Increase json parse size to handle encoded images
        app.use(bodyParser.json({ limit: HttpConstants.JSON_LIMIT }));

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
        report.versions = [ 'none' ];

        // TODO: once we determine which items we want to check versions on
        // TODO: we will add the version checks here
        return report;
    }
}
