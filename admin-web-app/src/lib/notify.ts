/** Ported from `admin/lib/notify.ts` — same volunteer email/push soft-fail behavior. */
import { createServiceClient } from '@/lib/supabase/server';
import { getResendClient, getFromAddress } from './resend';
import { writeAuditLog } from './audit';
import { logEmailSend } from './email-log';
import { getTemplate } from './email-templates';
import { renderTemplate } from './email-template-render';
import { sendExpoPush } from './push';

interface NotifyVolunteerSessionDecisionParams {
  userId: string;
  sessionId: string;
  decision: 'approved' | 'declined';
  declineReason?: string;
  activity?: string | null;
  /** Admin who triggered the decision — logged against the "email sent" audit entry so it
   * shows up on the volunteer's risk timeline (`loadVolunteerTimeline` in `live-data.ts`). */
  adminUserId?: string;
}

export async function notifyVolunteerSessionDecision({
  userId,
  sessionId,
  decision,
  declineReason,
  activity,
  adminUserId,
}: NotifyVolunteerSessionDecisionParams): Promise<void> {
  const supabase = await createServiceClient();

  const { data, error: userError } = await supabase.auth.admin.getUserById(userId);

  if (userError || !data?.user) {
    console.error(`[notify] Failed to fetch user ${userId}:`, userError);
    return;
  }

  const user = data.user;
  const email = user.email;
  const pushToken = user.user_metadata?.push_token as string | undefined;

  const template = await getTemplate(decision === 'approved' ? 'approved' : 'declined');
  const templateVars = { activity: activity ?? null, decline_reason: declineReason ?? null };
  const subject = renderTemplate(template.subject, templateVars);
  const emailBody = renderTemplate(template.bodyHtml, templateVars, { escapeHtml: true });

  if (email) {
    try {
      const resend = getResendClient();
      if (resend) {
        const { data, error: sendError } = await resend.emails.send({
          from: getFromAddress(),
          to: email,
          subject,
          html: emailBody,
        });
        console.log(`[notify] Email sent to ${email} for session ${sessionId}`);
        await logEmailSend(supabase, {
          userId,
          sessionId,
          templateType: decision === 'approved' ? 'approved' : 'declined',
          toEmail: email,
          subject,
          status: sendError ? 'failed' : 'sent',
          resendMessageId: data?.id ?? null,
          adminUserId: adminUserId ?? null,
        });
        if (adminUserId) {
          await writeAuditLog(supabase, {
            adminUserId,
            action: 'email sent',
            targetTable: 'sessions',
            targetId: sessionId,
            afterValue: { decision, to: email },
          });
        }
      } else {
        console.log(`[notify] Resend not configured; skipping email to ${email}`);
      }
    } catch (err) {
      console.error(`[notify] Failed to send email to ${email}:`, err);
      await logEmailSend(supabase, {
        userId,
        sessionId,
        templateType: decision === 'approved' ? 'approved' : 'declined',
        toEmail: email,
        subject,
        status: 'failed',
        adminUserId: adminUserId ?? null,
      });
    }
  }

  if (pushToken) {
    try {
      await sendExpoPush(pushToken, {
        title: decision === 'approved' ? 'Session Approved!' : 'Session Update',
        body:
          decision === 'approved'
            ? 'Your volunteer session has been approved.'
            : declineReason
              ? `Your session was not approved. ${declineReason}`
              : 'Your session was not approved.',
        data: { sessionId },
      });
      console.log(`[notify] Push notification sent to ${pushToken} for session ${sessionId}`);
    } catch (err) {
      console.error(`[notify] Failed to send push notification to ${pushToken}:`, err);
    }
  }
}
