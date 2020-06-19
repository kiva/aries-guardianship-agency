import { Injectable, INestApplication } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProtocolExceptionFilter } from '@kiva/protocol-common/protocol.exception.filter';
import { Logger } from '@kiva/protocol-common/logger';
import { LoggingInterceptor } from '@kiva/protocol-common/logging.interceptor';
import { DatadogLogger } from '@kiva/protocol-common/datadog.logger';
import { Constants } from '@kiva/protocol-common/constants';
import { traceware } from '@kiva/protocol-common/tracer';

/**
 * The Root Application Service
 */
@Injectable()
export class AppService {

    /**
     * Sets up app in a way that can be used by main.ts and e2e tests
     */
    public static async setup(app: INestApplication) {
        // Setting request-id middleware which assigns a unique requestid per incomming requests if not sent by client.
        const requestId = require('express-request-id')();
        app.use(requestId);

        const logger = new Logger(DatadogLogger.getLogger());
        app.useLogger(logger);

        app.use(helmet());

        const corsWhitelist = process.env.CORS_WHITELIST;
        if (!corsWhitelist) {
            app.enableCors();
        } else {
            app.enableCors({origin: corsWhitelist.split(',')});
        }
        app.useGlobalFilters(new ProtocolExceptionFilter());
        app.useGlobalInterceptors(new LoggingInterceptor());

        app.use(traceware(process.env.SERVICE_NAME));

        // Default is 100 requests per minute
        app.use(rateLimit({
            windowMs: process.env.RATE_LIMIT_WINDOW_MS,
            max: process.env.RATE_LIMIT_MAX,
        }));

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
}
