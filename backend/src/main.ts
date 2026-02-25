import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';

async function bootstrap() {
    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.enableCors();
    // Serve uploaded media at /media (WordPress-style: all images from one folder)
    app.use('/media', express.static(join(process.cwd(), 'uploads')));
    const port = process.env.PORT || 7000;
    await app.listen(port);
    console.log(`Application is running on port ${port}`);
}
bootstrap();
