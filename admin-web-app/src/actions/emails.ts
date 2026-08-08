'use server';

/** Ad-hoc email send — Compose flow on `/emails`, straight from the admin dashboard. */
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { logEmailSend } from '@/lib/email-log';
import { getResendClient, getFromAddress } from '@/lib/resend';
import { getAttachmentSignedUrls, type AttachmentRef } from '@/lib/email-attachments';
import { getVolunteerDirectory } from '@/lib/volunteers';
import { sanitizeEmailHtml } from '@/lib/sanitize-html';

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return { id: 'bypass-admin', user_metadata: { role: 'admin' } };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.user_metadata?.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  return user;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export type SendAdHocEmailInput = {
  /** Send to a volunteer on file, or an arbitrary address — exactly one should be set. */
  recipientUserId?: string;
  toEmail?: string;
  subject: string;
  bodyHtml: string;
  attachments?: AttachmentRef[];
};

export type SendAdHocEmailResult = { ok: boolean; error?: string };

export async function sendAdHocEmail(input: SendAdHocEmailInput): Promise<SendAdHocEmailResult> {
  const user = await getAdminUser();

  const subject = input.subject.trim();
  // Defense-in-depth: the client already sanitizes on paste/preview, but a
  // direct call to this action (bypassing the UI) shouldn't be able to ship
  // an unsanitized body to a real recipient.
  const bodyHtml = sanitizeEmailHtml(input.bodyHtml.trim());
  if (!subject || !bodyHtml) {
    throw new Error('Subject and body cannot be empty');
  }

  let toEmail: string | null = null;
  let userId: string | null = null;

  if (input.recipientUserId) {
    const directory = await getVolunteerDirectory();
    const entry = directory.get(input.recipientUserId);
    if (!entry?.email) {
      throw new Error('Selected volunteer has no email on file');
    }
    toEmail = entry.email;
    userId = input.recipientUserId;
  } else if (input.toEmail) {
    toEmail = input.toEmail.trim();
  }

  if (!toEmail || !isValidEmail(toEmail)) {
    throw new Error('A valid recipient is required');
  }

  const resend = getResendClient();
  const supabase = await createServiceClient();

  if (!resend) {
    return { ok: false, error: 'Email sending is not configured (RESEND_API_KEY unset)' };
  }

  const attachments = await getAttachmentSignedUrls(input.attachments ?? []);

  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to: toEmail,
    subject,
    html: bodyHtml,
    attachments: attachments.length > 0 ? attachments : undefined,
  });

  await logEmailSend(supabase, {
    userId,
    templateType: 'other',
    toEmail,
    subject,
    status: error ? 'failed' : 'sent',
    resendMessageId: data?.id ?? null,
    adminUserId: user.id,
  });

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'sent email',
    targetTable: 'email',
    targetId: userId ?? undefined,
    afterValue: { to_email: toEmail, subject, attachment_count: attachments.length },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
