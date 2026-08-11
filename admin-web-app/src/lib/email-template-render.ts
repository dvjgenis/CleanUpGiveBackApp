/**
 * Pure template constants + the `{{var}}`/`{{#if var}}` renderer — no server-only
 * imports, so this is safe to use from both server actions and the client-side
 * editor's live preview pane.
 */
export type EmailTemplateType = 'approved' | 'declined' | 'shipped' | 'event_registration' | 'hours_reminder';

export const EMAIL_TEMPLATE_TYPES: EmailTemplateType[] = [
  'approved',
  'declined',
  'shipped',
  'event_registration',
  'hours_reminder',
];

/** Templates surfaced in the Emails tab's template list/editor — everything else in
 * `EMAIL_TEMPLATE_TYPES` still sends automatically (session approve/decline, event
 * registration), it's just not user-facing as an editable template there.
 *
 * `shipped` is deliberately excluded: it's a branded table-based layout (see
 * `emailShell` below), and the Emails tab's WYSIWYG editor saves through
 * `sanitizeEmailHtml`, which strips `table`/`tr`/`td` and `img` style/width/height
 * attributes. Editing and saving it there would silently flatten the branding to
 * plain paragraphs on the next send. */
export const EMAIL_TAB_TEMPLATE_TYPES: EmailTemplateType[] = ['hours_reminder'];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  approved: 'Session approved',
  declined: 'Session declined',
  shipped: 'Order tracking',
  event_registration: 'Event registration',
  hours_reminder: 'Hours reminder',
};

/** Documented placeholders per template, shown in the editor and used to build the preview sample. */
export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateType, string[]> = {
  approved: ['activity'],
  declined: ['decline_reason', 'activity'],
  shipped: ['volunteer_name', 'tracking_number', 'carrier'],
  event_registration: ['event_title', 'event_when'],
  hours_reminder: ['volunteer_name'],
};

/** Re-export human labels — Templates UI inserts these as chips, never `{{brackets}}`. */
export { EMAIL_VARIABLE_LABELS, labelForVariable } from '@/lib/email-template-tokens';

export const EMAIL_TEMPLATE_SAMPLE_DATA: Record<EmailTemplateType, Record<string, string>> = {
  approved: { activity: 'Riverside Park Cleanup' },
  declined: { decline_reason: 'Photos submitted do not clearly show cleanup activity.', activity: 'Riverside Park Cleanup' },
  shipped: { volunteer_name: 'Jordan Rivera', tracking_number: '########', carrier: 'UPS' },
  event_registration: { event_title: 'Lakefront Trail Cleanup', event_when: ' on Sat, Mar 14 · 9:00 AM' },
  hours_reminder: { volunteer_name: 'Jordan Rivera' },
};

/** Hosted on the production admin deploy — Resend needs a publicly reachable image URL, not a repo-relative path. */
const EMAIL_LOGO_URL = 'https://cleanupgiveback-web-app.vercel.app/logo.png';

/**
 * Branded table-based shell (header logo bar / white card / footer) for templates
 * that should carry Clean Up Give Back branding. Inline CSS throughout — Gmail and
 * Outlook strip `<style>` blocks, so every rule has to live on the element itself.
 */
function emailShell(innerHtml: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fcf9f8;padding:32px 16px;"><tr><td align="center"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background-color:#ffffff;border:1px solid #e5e2e1;border-radius:12px;overflow:hidden;font-family:'Noto Sans',Arial,sans-serif;"><tr><td style="background-color:#009540;padding:20px 24px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding-right:10px;vertical-align:middle;"><img src="${EMAIL_LOGO_URL}" width="28" height="33" alt="Clean Up Give Back" style="display:block;"></td><td style="vertical-align:middle;font-family:Georgia,'Sanchez',serif;font-size:18px;font-weight:bold;color:#ffffff;">Clean Up Give Back</td></tr></table></td></tr><tr><td style="padding:32px 24px;color:#1c1b1b;font-size:15px;line-height:1.6;">${innerHtml}</td></tr><tr><td style="background-color:#fcf9f8;padding:16px 24px;border-top:1px solid #e5e2e1;"><p style="margin:0;font-size:12px;color:#3e4a3d;">Service tracking, simplified. &middot; Clean Up Give Back</p></td></tr></table></td></tr></table>`;
}

export const DEFAULT_TEMPLATES: Record<EmailTemplateType, { subject: string; bodyHtml: string }> = {
  approved: {
    subject: 'Your volunteer session has been approved!',
    bodyHtml:
      '<p>Good news! Your volunteer session has been approved.</p>{{#if activity}}<p>Activity: {{activity}}</p>{{/if}}<p>Thank you for your service to the community.</p>',
  },
  declined: {
    subject: 'Update on your volunteer session',
    bodyHtml:
      '<p>We have reviewed your volunteer session and it has not been approved.</p>{{#if decline_reason}}<p>Reason: {{decline_reason}}</p>{{/if}}{{#if activity}}<p>Activity: {{activity}}</p>{{/if}}<p>If you have questions, please reach out to us.</p>',
  },
  shipped: {
    subject: 'Your order is on its way!',
    bodyHtml: emailShell(
      `<p style="margin:0 0 16px;">Hi {{volunteer_name}},</p><p style="margin:0 0 16px;">Good news — your Clean Up Give Back order just shipped! It's on its way to you now.</p>{{#if tracking_number}}<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px;"><tr><td style="font-size:14px;color:#3e4a3d;padding-right:6px;">Tracking:</td><td style="font-size:14px;color:#1c1b1b;font-weight:bold;">{{tracking_number}}</td></tr></table>{{/if}}{{#if carrier}}<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr><td style="font-size:14px;color:#3e4a3d;padding-right:6px;">Carrier:</td><td style="font-size:14px;color:#1c1b1b;font-weight:bold;">{{carrier}}</td></tr></table>{{/if}}<p style="margin:0 0 16px;">Thanks so much for being part of our community — we hope you love your gear.</p><p style="margin:0;">Warmly,<br/>The Clean Up Give Back Team</p>`,
    ),
  },
  event_registration: {
    subject: "You're registered: {{event_title}}",
    bodyHtml:
      '<p>Thanks for registering with Clean Up Give Back.</p><p>Event: {{event_title}}{{event_when}}</p><p>We look forward to seeing you there.</p>',
  },
  hours_reminder: {
    subject: 'Missing you at Clean Up Give Back!',
    bodyHtml:
      "<p>Hi {{volunteer_name}},</p><p>We haven't seen a cleanup session from you in a little while — no worries if life's been busy! Whenever you get a chance, open the app to log your next session and keep your court-ordered hours moving along.</p><p>We really appreciate everything you do for the community.</p><p>Thanks,<br/>The Clean Up Give Back Team</p>",
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * `{{var}}` substitution + `{{#if var}}...{{/if}}` conditional blocks.
 * Missing/falsy variables render as empty string; `{{#if}}` blocks with a
 * missing/falsy variable are dropped entirely.
 *
 * Pass `escapeHtml: true` when rendering into an HTML body — several variables
 * (event titles, volunteer display names) can originate from user-editable
 * fields, so unescaped interpolation into `bodyHtml` is an HTML-injection /
 * phishing vector. Leave it off for the plain-text subject line.
 */
export function renderTemplate(
  text: string,
  variables: Record<string, string | null | undefined>,
  options?: { escapeHtml?: boolean },
): string {
  const withConditionals = text.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (_match, key: string, inner: string) =>
    variables[key] ? inner : '',
  );
  return withConditionals.replace(/{{(\w+)}}/g, (_match, key: string) => {
    const value = variables[key] ?? '';
    return options?.escapeHtml ? escapeHtml(value) : value;
  });
}
