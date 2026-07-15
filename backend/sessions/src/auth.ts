import type { FastifyReply, FastifyRequest } from 'fastify';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const SUPABASE_URL = (process.env.SUPABASE_URL ?? '').replace(/\/$/, '');

const JWKS = SUPABASE_URL
  ? createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`))
  : null;

export type AuthenticatedRequest = FastifyRequest & {
  userId: string;
};

export async function verifyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  if (!JWKS || !SUPABASE_URL) {
    reply.code(500).send({ error: 'Server misconfigured: missing SUPABASE_URL' });
    return;
  }

  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `${SUPABASE_URL}/auth/v1`,
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
