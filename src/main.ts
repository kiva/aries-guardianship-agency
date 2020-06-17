import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { AppService } from './app/app.service';
import { Logger } from '@kiva/protocol-common/logger';
import { AgentManagerService } from 'manager/agent.manager.service';

async function bootstrap() {
    const port = process.env.PORT;
    const app = await NestFactory.create(AppModule);

    await AppService.setup(app);
    await app.listen(port);
    Logger.info(`Server started on ${port}`);
}
bootstrap();
