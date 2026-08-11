'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import { logEmailSend } from '@/lib/email-log';
import { getTemplate } from '@/lib/email-templates';
import { renderTemplate } from '@/lib/email-template-render';
import { getResendClient, getFromAddress } from '@/lib/resend';
import { getVolunteerDirectory, isMockAddress } from '@/lib/volunteers';

async function getAdminUser() {
  if (process.env.BYPASS_AUTH === 'true') {
    return {
      id: 'bypass-admin',
      user_metadata: { role: 'admin' },
    };
  }
  // For now, assume admin access in web-app. In production, this would check auth.
  return {
    id: 'web-app-admin',
    user_metadata: { role: 'admin' },
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export async function updateOrderFulfillment({
  orderId,
  status,
  trackingNumber,
  carrier,
}: {
  orderId: string;
  status: string;
  trackingNumber?: string;
  carrier?: string;
}) {
  if (!isUuid(orderId)) {
    throw new Error(
      `Cannot update mock order "${orderId}". Order fulfillment requires live shop_orders rows (UUID).`
    );
  }

  const user = await getAdminUser();
  const supabase = await createServiceClient();

  // `delivered` is treated as `shipped` — keep a single post-dispatch status.
  const normalizedStatus = status === 'delivered' ? 'shipped' : status;

  const { data: before, error: fetchError } = await supabase
    .from('shop_orders')
    .select('user_id, status, tracking_number, carrier')
    .eq('id', orderId)
    .single();

  if (fetchError || !before) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const update: Record<string, unknown> = { status: normalizedStatus };
  if (trackingNumber !== undefined) update.tracking_number = trackingNumber?.trim() || null;
  if (carrier !== undefined) update.carrier = carrier?.trim() || null;

  const { error } = await supabase.from('shop_orders').update(update).eq('id', orderId);
  if (error) throw new Error(error.message);

  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'updated order fulfillment',
    targetTable: 'shop_orders',
    targetId: orderId,
    beforeValue: before,
    afterValue: update,
  });

  // Only notify on the transition into 'shipped', not on every subsequent edit
  // (e.g. a tracking-number correction on an already-shipped order).
  if (before.status !== 'shipped' && normalizedStatus === 'shipped' && before.user_id) {
    await notifyOrderShipped({
      supabase,
      userId: before.user_id,
      trackingNumber: (update.tracking_number as string | null) ?? null,
      carrier: (update.carrier as string | null) ?? null,
      adminUserId: user.id,
    });
  }

  revalidatePath('/orders');
  revalidatePath(`/orders/${orderId}`);
}

async function notifyOrderShipped({
  supabase,
  userId,
  trackingNumber,
  carrier,
  adminUserId,
}: {
  supabase: Awaited<ReturnType<typeof createServiceClient>>;
  userId: string;
  trackingNumber: string | null;
  carrier: string | null;
  adminUserId: string;
}): Promise<void> {
  const directory = await getVolunteerDirectory();
  const entry = directory.get(userId);
  if (!entry?.email || isMockAddress(entry.email)) return;

  const resend = getResendClient();
  const template = await getTemplate('shipped');
  const templateVars = {
    volunteer_name: entry.name,
    tracking_number: trackingNumber?.trim() || '[blank]',
    carrier: carrier?.trim() || '[blank]',
  };
  const subject = renderTemplate(template.subject, templateVars);

  if (!resend) return;

  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to: entry.email,
    subject,
    html: renderTemplate(template.bodyHtml, templateVars, { escapeHtml: true }),
  });

  await logEmailSend(supabase, {
    userId,
    templateType: 'shipped',
    toEmail: entry.email,
    subject,
    status: error ? 'failed' : 'sent',
    resendMessageId: data?.id ?? null,
    adminUserId,
  });
}