import cors from '@fastify/cors';
import Fastify from 'fastify';

import { registerEmailRoutes } from './routes/emails.js';
import { registerSessionRoutes } from './routes/sessions.js';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Admin-Key'],
  });

  app.get('/health', async () => ({ status: 'ok' }));

  await registerSessionRoutes(app);
  await registerEmailRoutes(app);

  await app.listen({ port: PORT, host: HOST });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
