import type { IncomingMessage, ServerResponse } from 'node:http';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createApp } from '../../api/dist/bootstrap';

type ExpressHandler = (request: IncomingMessage, response: ServerResponse) => void;

let appPromise: Promise<NestExpressApplication> | undefined;

export const config = {
  api: { bodyParser: false },
};

export default async function handler(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  try {
    appPromise ??= createApp();
    const app = await appPromise;
    const expressHandler = app.getHttpAdapter().getInstance() as ExpressHandler;

    // Vercel may provide the catch-all route suffix; Nest's global prefix includes /api.
    if (request.url && !request.url.startsWith('/api/')) {
      request.url = `/api${request.url.startsWith('/') ? '' : '/'}${request.url}`;
    }

    expressHandler(request, response);
  } catch (error) {
    console.error('MarketNet API function initialization failed', error);
    if (!response.headersSent) {
      response.statusCode = 500;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    response.end(JSON.stringify({ message: 'API temporarily unavailable.' }));
  }
}
