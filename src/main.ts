import { NestFactory } from '@nestjs/core';
import { Logger } from 'protocol-common/logger';
import { AppModule } from './app/app.module';
import { AppService } from './app/app.service';

async function bootstrap() {
    const port = process.env.PORT;
    const app = await NestFactory.create(AppModule);

    await AppService.setup(app);
    await app.listen(port);
    Logger.info(`Server started on ${port}`);
}
bootstrap();
