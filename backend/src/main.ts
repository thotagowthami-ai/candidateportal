import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configuredOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const previewOrigins = (process.env.CORS_ALLOWED_PREVIEWS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://candidateportal-dmx4.vercel.app',
  ];
  const allowedOrigins = new Set([
    ...defaultOrigins,
    ...configuredOrigins,
    ...previewOrigins,
  ]);

  const trustNullOrigin =
    (process.env.TRUST_NULL_ORIGIN || 'false').toLowerCase() === 'true';

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use(limiter);
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ limit: '2mb', extended: true }));

  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests
      if (!origin) {
        callback(null, true);
        return;
      }

      // Exact string match for allowed origins
      if (allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      // Explicit flag for 'null' origin
      if (origin === 'null' && trustNullOrigin) {
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
