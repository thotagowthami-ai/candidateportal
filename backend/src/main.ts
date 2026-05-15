import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://candidateportal-dmx4.vercel.app',
  ];
  const allowedOrigins = new Set([...defaultOrigins, ...configuredOrigins]);
  const allowVercelPreviews =
    (process.env.CORS_ALLOW_VERCEL_PREVIEWS || 'true').toLowerCase() === 'true';

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ limit: '15mb', extended: true }));

  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      if (allowVercelPreviews) {
        try {
          const host = new URL(origin).hostname;
          if (host.endsWith('.vercel.app')) {
            callback(null, true);
            return;
          }
        } catch {
          // Invalid origin format, reject below.
        }
      }

      if (origin === 'null') {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const PORT = process.env.PORT || 3000;
  await app.listen(PORT, '0.0.0.0');

  console.log(`Resume Portal Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
}

bootstrap().catch((err) => console.error(err));
