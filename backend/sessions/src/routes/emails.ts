import type { FastifyInstance } from 'fastify';
import { Resend } from 'resend';

import type { AuthenticatedRequest } from '../auth.js';
import { verifyAuth } from '../auth.js';

type EventRegistrationBody = {
  to?: string;
  eventTitle?: string;
  eventDateTime?: string;
};

type EmailChangeRequestBody = {
  to?: string;
};

type EmailChangeConfirmBody = {
  to?: string;
  code?: string;
};

type PendingCode = {
  code: string;
  expiresAt: number;
};

const CODE_TTL_MS = 10 * 60 * 1000;
const pendingEmailCodes = new Map<string, PendingCode>();

function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

function getFromAddress(): string {
  return process.env.EMAIL_FROM ?? 'noreply@cleanupgiveback.org';
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function pruneExpiredCodes(now = Date.now()): void {
  for (const [email, entry] of pendingEmailCodes) {
    if (entry.expiresAt <= now) {
      pendingEmailCodes.delete(email);
    }
  }
}

export async function registerEmailRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/emails/event-registration',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const body = (request.body ?? {}) as EventRegistrationBody;
      const to = typeof body.to === 'string' ? normalizeEmail(body.to) : '';
      const eventTitle =
        typeof body.eventTitle === 'string' ? body.eventTitle.trim() : '';
      const eventDateTime =
        typeof body.eventDateTime === 'string' ? body.eventDateTime.trim() : '';

      if (!isValidEmail(to) || !eventTitle) {
        return reply.code(400).send({ error: 'to and eventTitle are required' });
      }

      const resend = getResendClient();
      if (!resend) {
        request.log.warn('RESEND_API_KEY not set; skipping event registration email');
        return reply.send({ ok: true, skipped: true });
      }

      const when = eventDateTime ? ` on ${eventDateTime}` : '';
      const { error } = await resend.emails.send({
        from: getFromAddress(),
        to,
        subject: `You're registered: ${eventTitle}`,
        text: [
          `Thanks for registering with Clean Up Give Back.`,
          '',
          `Event: ${eventTitle}${when}`,
          '',
          'We look forward to seeing you there.',
          '',
          '— Clean Up Give Back',
        ].join('\n'),
      });

      if (error) {
        request.log.error({ err: error }, 'Failed to send event registration email');
        return reply.code(502).send({ error: 'Failed to send email' });
      }

      return reply.send({ ok: true });
    },
  );

  app.post(
    '/emails/email-change/request',
    { preHandler: verifyAuth },
    async (request, reply) => {
      const body = (request.body ?? {}) as EmailChangeRequestBody;
      const to = typeof body.to === 'string' ? normalizeEmail(body.to) : '';

      if (!isValidEmail(to)) {
        return reply.code(400).send({ error: 'Valid to email is required' });
      }

      pruneExpiredCodes();
      const code = generateCode();
      pendingEmailCodes.set(to, { code, expiresAt: Date.now() + CODE_TTL_MS });

      const resend = getResendClient();
      if (!resend) {
        request.log.warn(
          { code },
          'RESEND_API_KEY not set; email-change code logged for local/dev',
        );
        return reply.send({
          ok: true,
          skipped: true,
          ...(process.env.NODE_ENV !== 'production' ? { debugCode: code } : {}),
        });
      }

      const { error } = await resend.emails.send({
        from: getFromAddress(),
        to,
        subject: 'Confirm your email change',
        text: [
          'You requested to change your Clean Up Give Back account email.',
          '',
          `Your verification code is: ${code}`,
          '',
          'This code expires in 10 minutes. If you did not request this, ignore this email.',
        ].join('\n'),
      });

      if (error) {
        pendingEmailCodes.delete(to);
        request.log.error({ err: error }, 'Failed to send email-change code');
        return reply.code(502).send({ error: 'Failed to send email' });
      }

      return reply.send({ ok: true });
    },
  );

  app.post(
    '/emails/email-change/confirm',
    { preHandler: verifyAuth },
    async (request, reply) => {
      void (request as AuthenticatedRequest).userId;
      const body = (request.body ?? {}) as EmailChangeConfirmBody;
      const to = typeof body.to === 'string' ? normalizeEmail(body.to) : '';
      const code = typeof body.code === 'string' ? body.code.trim() : '';

      if (!isValidEmail(to) || !/^\d{6}$/.test(code)) {
        return reply.code(400).send({ error: 'Valid to email and 6-digit code are required' });
      }

      pruneExpiredCodes();
      const pending = pendingEmailCodes.get(to);
      if (!pending || pending.code !== code) {
        return reply.code(400).send({ error: 'Invalid or expired code' });
      }

      pendingEmailCodes.delete(to);
      return reply.send({ ok: true });
    },
  );
}
