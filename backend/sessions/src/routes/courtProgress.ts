import type { FastifyInstance } from 'fastify';
import { SessionStatus } from '@prisma/client';

import type { AuthenticatedRequest } from '../auth.js';
import { verifyAuth } from '../auth.js';
import { prisma } from '../prisma.js';
import { sessionHours } from '../letterhead/formatters.js';

/** Mirrors admin-web-app's `lib/court-risk.ts` "at risk" window. Deliberately duplicated —
 * `backend/sessions` is a separate deployable — see the cross-reference note in
 * `letterhead/buildServiceLetter.tsx`'s `buildCourtCoverSheet`. Keep both in sync. */
const AT_RISK_WINDOW_DAYS = 14;

export type CourtProgressResponse = {
  hasCourtOrder: boolean;
  requiredHours: number | null;
  completedHours: number;
  remainingHours: number;
  dueDate: string | null;
  caseReference: string | null;
  status: 'completed' | 'at_risk' | 'in_progress' | null;
};

export async function registerCourtProgressRoutes(app: FastifyInstance) {
  app.get('/me/court-progress', { preHandler: verifyAuth }, async (request) => {
    const userId = (request as AuthenticatedRequest).userId;

    const courtOrder = await prisma.courtOrder.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!courtOrder) {
      const empty: CourtProgressResponse = {
        hasCourtOrder: false,
        requiredHours: null,
        completedHours: 0,
        remainingHours: 0,
        dueDate: null,
        caseReference: null,
        status: null,
      };
      return empty;
    }

    // Only approved, court-ordered sessions count toward the requirement —
    // voluntary hours don't reduce a court obligation.
    const completedSessions = await prisma.session.findMany({
      where: { userId, status: SessionStatus.approved, courtOrdered: true },
      select: { durationSeconds: true, adjustedHours: true },
    });
    const completedHours = completedSessions.reduce((sum, session) => sum + sessionHours(session), 0);
    const requiredHours = Number(courtOrder.requiredHours);
    const remainingHours = Math.max(0, requiredHours - completedHours);

    let status: CourtProgressResponse['status'] = 'in_progress';
    if (remainingHours <= 0) {
      status = 'completed';
    } else if (courtOrder.dueDate) {
      const daysUntilDue = Math.ceil((courtOrder.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysUntilDue <= AT_RISK_WINDOW_DAYS) {
        status = 'at_risk';
      }
    }

    const response: CourtProgressResponse = {
      hasCourtOrder: true,
      requiredHours,
      completedHours,
      remainingHours,
      dueDate: courtOrder.dueDate ? courtOrder.dueDate.toISOString().slice(0, 10) : null,
      caseReference: courtOrder.caseReference,
      status,
    };
    return response;
  });
}
