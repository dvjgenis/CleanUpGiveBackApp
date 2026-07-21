import type { FastifyInstance } from 'fastify';
import { Prisma, SessionStatus } from '@prisma/client';

import type { AuthenticatedRequest } from '../auth.js';
import { verifyAuth } from '../auth.js';
import { prisma } from '../prisma.js';

type CreateSessionBody = {
  activity?: string;
  courtOrdered?: boolean;
  description?: string;
  date?: string;
};

type CheckpointBody = {
  selfiePath: string;
  progressPath: string;
  capturedAt: string;
  submittedEarly?: boolean;
};

type FinalizeBody = {
  endedAt: string;
  durationSeconds: number;
  distanceMiles: number;
  route: number[][];
  status?: SessionStatus;
};

type ApprovalBody = {
  status: 'approved' | 'not_approved' | 'invalid';
};

function serializeSession(session: {
  id: string;
  userId: string;
  activity: string | null;
  courtOrdered: boolean;
  description: string | null;
  startedAt: Date | null;
  endedAt: Date | null;
  durationSeconds: number | null;
  distanceMiles: Prisma.Decimal | null;
  route: Prisma.JsonValue;
  status: SessionStatus;
  createdAt: Date;
  _count?: { checkpoints: number };
}) {
  const checkpointCount = session._count?.checkpoints ?? 0;

  return {
    id: session.id,
    userId: session.userId,
    activity: session.activity,
    courtOrdered: session.courtOrdered,
    description: session.description,
    startedAt: session.startedAt?.toISOString() ?? null,
    endedAt: session.endedAt?.toISOString() ?? null,
    durationSeconds: session.durationSeconds,
    distanceMiles: session.distanceMiles ? Number(session.distanceMiles) : null,
    route: session.route,
    status: session.status,
    createdAt: session.createdAt.toISOString(),
    checkpointCount,
    photoCount: checkpointCount * 2,
  };
}

export async function registerSessionRoutes(app: FastifyInstance) {
  app.post<{ Body: CreateSessionBody }>(
    '/sessions',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const body = request.body ?? {};

      const session = await prisma.session.create({
        data: {
          userId,
          activity: body.activity ?? null,
          courtOrdered: body.courtOrdered ?? false,
          description: body.description ?? null,
          startedAt: new Date(),
          status: SessionStatus.active,
        },
      });

      return reply.code(201).send({
        id: session.id,
        status: session.status,
        startedAt: session.startedAt?.toISOString(),
      });
    },
  );

  app.post<{ Params: { id: string }; Body: CheckpointBody }>(
    '/sessions/:id/checkpoints',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;
      const body = request.body;

      const session = await prisma.session.findFirst({
        where: { id, userId, status: SessionStatus.active },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Active session not found' });
      }

      if (!body?.selfiePath || !body?.progressPath || !body?.capturedAt) {
        return reply.code(400).send({ error: 'Missing checkpoint fields' });
      }

      const checkpoint = await prisma.checkpoint.create({
        data: {
          sessionId: id,
          selfiePath: body.selfiePath,
          progressPath: body.progressPath,
          capturedAt: new Date(body.capturedAt),
          submittedEarly: body.submittedEarly ?? false,
        },
      });

      return reply.code(201).send({ id: checkpoint.id });
    },
  );

  app.patch<{ Params: { id: string }; Body: FinalizeBody }>(
    '/sessions/:id/finalize',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;
      const body = request.body;

      const session = await prisma.session.findFirst({
        where: { id, userId, status: SessionStatus.active },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Active session not found' });
      }

      if (
        !body?.endedAt ||
        body.durationSeconds == null ||
        body.distanceMiles == null ||
        !Array.isArray(body.route)
      ) {
        return reply.code(400).send({ error: 'Missing finalize fields' });
      }

      const endedAt = new Date(body.endedAt);
      const durationSeconds =
        session.startedAt != null
          ? Math.max(
              0,
              Math.round((endedAt.getTime() - session.startedAt.getTime()) / 1000),
            )
          : body.durationSeconds;

      const nextStatus =
        body.status === SessionStatus.invalid
          ? SessionStatus.invalid
          : SessionStatus.under_review;

      const updated = await prisma.session.update({
        where: { id },
        data: {
          endedAt,
          durationSeconds,
          distanceMiles: body.distanceMiles,
          route: body.route,
          status: nextStatus,
        },
      });

      return reply.send({
        id: updated.id,
        status: updated.status,
      });
    },
  );

  app.get<{ Querystring: { status?: string; limit?: string; offset?: string } }>(
    '/sessions',
    { preHandler: verifyAuth },
    async (request) => {
      const { userId } = request as AuthenticatedRequest;
      const { status, limit = '50', offset = '0' } = request.query;

      const where: Prisma.SessionWhereInput = { userId };
      if (status && Object.values(SessionStatus).includes(status as SessionStatus)) {
        where.status = status as SessionStatus;
      }

      const sessions = await prisma.session.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(Number(limit) || 50, 100),
        skip: Number(offset) || 0,
        include: {
          _count: {
            select: { checkpoints: true },
          },
        },
      });

      return { sessions: sessions.map(serializeSession) };
    },
  );

  app.get<{ Params: { id: string } }>(
    '/sessions/:id',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;

      const session = await prisma.session.findFirst({
        where: { id, userId },
        include: { checkpoints: { orderBy: { capturedAt: 'asc' } } },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      const { checkpoints, ...rest } = session;
      return {
        session: serializeSession(rest),
        checkpoints: checkpoints.map((cp) => ({
          id: cp.id,
          selfiePath: cp.selfiePath,
          progressPath: cp.progressPath,
          capturedAt: cp.capturedAt?.toISOString() ?? null,
          submittedEarly: cp.submittedEarly,
        })),
      };
    },
  );

  app.patch<{ Params: { id: string }; Body: ApprovalBody }>(
    '/sessions/:id/approval',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { id } = request.params;
      const body = request.body;

      const adminKey = process.env.ADMIN_API_KEY;
      const providedKey = request.headers['x-admin-key'];
      if (!adminKey || providedKey !== adminKey) {
        return reply.code(403).send({ error: 'Admin access required' });
      }

      if (
        !body?.status ||
        !['approved', 'not_approved', 'invalid'].includes(body.status)
      ) {
        return reply.code(400).send({ error: 'Invalid status' });
      }

      const updated = await prisma.session.update({
        where: { id },
        data: { status: body.status as SessionStatus },
      });

      return { id: updated.id, status: updated.status };
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/sessions/:id',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const { userId } = request as AuthenticatedRequest;
      const { id } = request.params;

      const session = await prisma.session.findFirst({
        where: { id, userId },
      });

      if (!session) {
        return reply.code(404).send({ error: 'Session not found' });
      }

      if (session.status === SessionStatus.approved) {
        return reply.code(409).send({ error: 'Approved sessions cannot be deleted' });
      }

      await prisma.session.delete({
        where: { id },
      });

      return reply.code(204).send();
    },
  );
}
