import { ConfigService } from '@nestjs/config';
import { createApp } from './bootstrap';

async function bootstrap() {
  const app = await createApp();
  const port = app.get(ConfigService).get<number>('API_PORT') || 3001;
  await app.listen(port);
}

bootstrap();
