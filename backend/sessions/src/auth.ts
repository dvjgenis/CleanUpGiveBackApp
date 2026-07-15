import type { FastifyReply, FastifyRequest } from 'fastify';
import { createSecretKey } from 'node:crypto';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET;

export type AuthenticatedRequest = FastifyRequest & {
  userId: string;
};

export async function verifyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!JWT_SECRET) {
    reply.code(500).send({ error: 'Server misconfigured: missing JWT secret' });
    return;
  }

  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const key = createSecretKey(Buffer.from(JWT_SECRET, 'utf8'));
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });

    const sub = payload.sub;
    if (!sub || typeof sub !== 'string') {
      reply.code(401).send({ error: 'Invalid token: missing subject' });
      return;
    }

    (request as AuthenticatedRequest).userId = sub;
  } catch {
    reply.code(401).send({ error: 'Invalid or expired token' });
  }
}
