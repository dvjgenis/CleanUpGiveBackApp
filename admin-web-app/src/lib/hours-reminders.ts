/**
 * Nudges court-ordered volunteers who haven't logged a session in 7-10 days,
 * via the `hours_reminder` email template. Runs daily off Vercel cron
 * (`/api/cron/send-hours-reminders`) — the 7-10 day window plus a "sent in the
 * last 7 days" dedup guard (via `email_log`) keeps this to roughly one nudge
 * per volunteer per idle stretch, not one every day they sit in the window.
 */
import { createServiceClient } from '@/lib/supabase/server';
import { getVolunteerDirectory, isMockAddress } from '@/lib/volunteers';
import { getTemplate } from '@/lib/email-templates';
import { renderTemplate } from '@/lib/email-template-render';
import { getResendClient, getFromAddress } from '@/lib/resend';
import { logEmailSend } from '@/lib/email-log';

const MIN_IDLE_DAYS = 7;
const MAX_IDLE_DAYS = 10;
const DEDUP_WINDOW_DAYS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type HoursReminderResult = {
  sent: number;
  failed: number;
  skippedNoEmail: number;
  skippedRecentlyReminded: number;
  eligible: number;
};

export async function sendHoursReminders(now = new Date()): Promise<HoursReminderResult> {
  const supabase = await createServiceClient();

  const { data: courtOrders } = await supabase.from('court_orders').select('user_id');
  const courtOrderedUserIds = (courtOrders ?? []).map((o) => o.user_id);

  const result: HoursReminderResult = {
    sent: 0,
    failed: 0,
    skippedNoEmail: 0,
    skippedRecentlyReminded: 0,
    eligible: 0,
  };

  if (courtOrderedUserIds.length === 0) {
    return result;
  }

  const [{ data: sessions }, { data: recentReminders }, directory] = await Promise.all([
    supabase
      .from('sessions')
      .select('user_id, started_at, created_at')
      .neq('status', 'active')
      .in('user_id', courtOrderedUserIds),
    supabase
      .from('email_log')
      .select('user_id, sent_at')
      .eq('template_type', 'hours_reminder')
      .gte('sent_at', new Date(now.getTime() - DEDUP_WINDOW_DAYS * MS_PER_DAY).toISOString()),
    getVolunteerDirectory(),
  ]);

  const lastSessionByUser = new Map<string, number>();
  for (const s of sessions ?? []) {
    const at = s.started_at ?? s.created_at;
    if (!at) continue;
    const ts = new Date(at).getTime();
    const prev = lastSessionByUser.get(s.user_id);
    if (prev == null || ts > prev) lastSessionByUser.set(s.user_id, ts);
  }

  const recentlyRemindedUserIds = new Set((recentReminders ?? []).map((r) => r.user_id));

  const template = await getTemplate('hours_reminder');
  const resend = getResendClient();

  for (const userId of courtOrderedUserIds) {
    const lastSessionAt = lastSessionByUser.get(userId);
    // No session on record at all counts as idle too — treat as "always eligible"
    // once outside the dedup window, same as a stale last-session date would be.
    const idleDays = lastSessionAt != null ? (now.getTime() - lastSessionAt) / MS_PER_DAY : Infinity;
    if (idleDays < MIN_IDLE_DAYS || idleDays > MAX_IDLE_DAYS) continue;

    result.eligible += 1;

    if (recentlyRemindedUserIds.has(userId)) {
      result.skippedRecentlyReminded += 1;
      continue;
    }

    const entry = directory.get(userId);
    if (!entry?.email || isMockAddress(entry.email)) {
      result.skippedNoEmail += 1;
      continue;
    }
    if (!resend) {
      result.failed += 1;
      continue;
    }

    const templateVars = { volunteer_name: entry.name };
    const subject = renderTemplate(template.subject, templateVars);
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: entry.email,
      subject,
      html: renderTemplate(template.bodyHtml, templateVars, { escapeHtml: true }),
    });

    await logEmailSend(supabase, {
      userId,
      templateType: 'hours_reminder',
      toEmail: entry.email,
      subject,
      status: error ? 'failed' : 'sent',
      resendMessageId: data?.id ?? null,
    });

    if (error) result.failed += 1;
    else result.sent += 1;
  }

  return result;
}
