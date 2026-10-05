import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

import { AppModule } from './app/app.module';

export async function createApp(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.use(helmet());
  // Stay below Vercel's ~4.5 MB request limit; uploaded images are stored as compressed data URLs in PostgreSQL.
  app.use(require('express').json({ limit: '4mb' }));
  app.use(require('express').urlencoded({ limit: '4mb', extended: true }));
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const vercelOrigin = configService.get<string>('VERCEL_URL');
      const allowed = [
        configService.get<string>('APP_URL') || 'http://localhost:3000',
        'http://localhost:3000',
        'http://localhost:3001',
        ...(vercelOrigin ? [`https://${vercelOrigin}`] : []),
      ];
      if (allowed.includes(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  });

  await app.init();
  return app;
}
