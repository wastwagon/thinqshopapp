import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import helmet from 'helmet';

if (process.env.SENTRY_DSN) {
    Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.NODE_ENV || 'development' });
}

async function bootstrap() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET environment variable is required. Set it in .env or your deployment config.');
    }

    const app = await NestFactory.create<NestExpressApplication>(AppModule);
    app.use(helmet({ contentSecurityPolicy: false }));

    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = Date.now() - start;
            console.log(`${new Date().toISOString()} ${req.method} ${req.url} ${res.statusCode} ${duration}ms`);
        });
        next();
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }),
    );

    const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN;
    if (frontendUrl) {
        const origins = frontendUrl.split(',').map((o) => o.trim().replace(/\/$/, ''));
        app.enableCors({ origin: origins, credentials: true });
    } else {
        app.enableCors();
    }

    const config = new DocumentBuilder()
        .setTitle('ThinQShop API')
        .setDescription('ThinQShop e-commerce and services API')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    app.use('/media', express.static(join(process.cwd(), 'uploads')));
    const port = process.env.PORT || 7000;
    await app.listen(port);
    console.log(`Application is running on port ${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
