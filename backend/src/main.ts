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
    const rawBodySaver = (req: any, _res: any, buf: Buffer) => {
        if (buf?.length) req.rawBody = buf.toString('utf8');
    };
    // Increase body limit for transfer QR code uploads (base64 images)
    app.useBodyParser('json', { limit: '10mb', verify: rawBodySaver });
    app.useBodyParser('urlencoded', { limit: '10mb', extended: true });
    // Allow media on this API host to load in <img>/next/image on the storefront (different origin).
    const isProd = process.env.NODE_ENV === 'production';
    app.use(
        helmet({
            contentSecurityPolicy: isProd
                ? { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }
                : false,
            crossOriginResourcePolicy: { policy: 'cross-origin' },
        }),
    );

    app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        const start = Date.now();
        res.on('finish', () => {
            const pathOnly = (req.originalUrl || req.url || '').split('?')[0];
            if (pathOnly === '/health' || pathOnly === '/ready') return;
            console.log(
                JSON.stringify({
                    ts: new Date().toISOString(),
                    method: req.method,
                    path: pathOnly,
                    status: res.statusCode,
                    ms: Date.now() - start,
                }),
            );
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
    } else if (isProd) {
        throw new Error('FRONTEND_URL environment variable is required in production (CORS).');
    } else {
        app.enableCors();
    }

    if (!isProd || process.env.SWAGGER_ENABLED === 'true') {
        const config = new DocumentBuilder()
            .setTitle('ThinQShop API')
            .setDescription('ThinQShop e-commerce and services API')
            .setVersion('1.0')
            .addBearerAuth()
            .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('api/docs', app, document);
    }

    app.use('/media', express.static(join(process.cwd(), 'uploads')));
    const port = process.env.PORT || 7000;
    await app.listen(port);
    console.log(`Application is running on port ${port}`);
    if (!isProd || process.env.SWAGGER_ENABLED === 'true') {
        console.log(`Swagger docs: http://localhost:${port}/api/docs`);
    }
}
bootstrap().catch((err) => {
    console.error('Bootstrap failed:', err);
    process.exit(1);
});
