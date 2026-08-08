/**
 * Pure template constants + the `{{var}}`/`{{#if var}}` renderer — no server-only
 * imports, so this is safe to use from both server actions and the client-side
 * editor's live preview pane.
 */
export type EmailTemplateType = 'approved' | 'declined' | 'shipped' | 'event_registration' | 'at_risk_nudge';

export const EMAIL_TEMPLATE_TYPES: EmailTemplateType[] = [
  'approved',
  'declined',
  'shipped',
  'event_registration',
  'at_risk_nudge',
];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateType, string> = {
  approved: 'Session approved',
  declined: 'Session declined',
  shipped: 'Order shipped',
  event_registration: 'Event registration',
  at_risk_nudge: 'At-risk nudge',
};

/** Documented placeholders per template, shown in the editor and used to build the preview sample. */
export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateType, string[]> = {
  approved: ['activity'],
  declined: ['decline_reason', 'activity'],
  shipped: ['volunteer_name', 'tracking_number', 'carrier'],
  event_registration: ['event_title', 'event_when'],
  at_risk_nudge: ['volunteer_name', 'event_title', 'event_when', 'event_address', 'event_maps_url'],
};

export const EMAIL_TEMPLATE_SAMPLE_DATA: Record<EmailTemplateType, Record<string, string>> = {
  approved: { activity: 'Riverside Park Cleanup' },
  declined: { decline_reason: 'Photos submitted do not clearly show cleanup activity.', activity: 'Riverside Park Cleanup' },
  shipped: { volunteer_name: 'Jordan Rivera', tracking_number: '1Z999AA10123456784', carrier: 'UPS' },
  event_registration: { event_title: 'Lakefront Trail Cleanup', event_when: ' on Sat, Mar 14 · 9:00 AM' },
  at_risk_nudge: {
    volunteer_name: 'Jordan Rivera',
    event_title: 'Lakefront Trail Cleanup',
    event_when: 'Sat, Mar 14 · 9:00 AM',
    event_address: '123 Lakefront Dr, Chicago, IL',
    event_maps_url: 'https://www.google.com/maps/search/?api=1&query=123+Lakefront+Dr%2C+Chicago%2C+IL',
  },
};

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
    subject: 'Your Clean Up Give Back order has shipped!',
    bodyHtml:
      '<p>Hi {{volunteer_name}},</p><p>Your order has shipped{{#if tracking_number}} — tracking number: {{tracking_number}}{{/if}}{{#if carrier}} via {{carrier}}{{/if}}.</p><p>Thanks for volunteering with us.</p>',
  },
  event_registration: {
    subject: "You're registered: {{event_title}}",
    bodyHtml:
      '<p>Thanks for registering with Clean Up Give Back.</p><p>Event: {{event_title}}{{event_when}}</p><p>We look forward to seeing you there.</p>',
  },
  at_risk_nudge: {
    subject: 'Catch up on your court hours: {{event_title}}',
    bodyHtml:
      "<p>Hi {{volunteer_name}},</p><p>You still have court-ordered hours remaining. Here's an upcoming Clean Up Give Back event you can join:</p><p>{{event_title}}<br/>{{event_when}}{{#if event_address}}<br/>{{event_address}}{{/if}}</p>{{#if event_maps_url}}<p><a href=\"{{event_maps_url}}\">Directions</a></p>{{/if}}<p>Open the Clean Up Give Back app to register.</p>",
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
