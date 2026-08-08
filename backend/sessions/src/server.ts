import cors from '@fastify/cors';
import Fastify from 'fastify';

import { prisma } from './prisma.js';
import { registerCourtProgressRoutes } from './routes/courtProgress.js';
import { registerEmailRoutes } from './routes/emails.js';
import { registerServiceLetterRoutes } from './routes/serviceLetter.js';
import { registerSessionRoutes } from './routes/sessions.js';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Admin-Key'],
  });

  app.get('/health', async () => ({ status: 'ok' }));

  // Checked by admin-web-app's production readiness page (`lib/health-checks.ts`) to
  // confirm the Sessions API can actually reach its database, not just that the
  // process is up.
  app.get('/health/deep', async (_request, reply) => {
    const startedAt = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', checks: { database: true, timestampMs: Date.now() - startedAt } };
    } catch (error) {
      reply.status(503);
      return {
        status: 'error',
        checks: { database: false, timestampMs: Date.now() - startedAt },
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  await registerServiceLetterRoutes(app);
  await registerSessionRoutes(app);
  await registerEmailRoutes(app);
  await registerCourtProgressRoutes(app);

  await app.listen({ port: PORT, host: HOST });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
