'use server';

/** Editable email templates — admin-only write, audit-logged like every other admin mutation. */
import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { writeAuditLog } from '@/lib/audit';
import {
  createCustomTemplate,
  deleteCustomTemplate,
  getTemplate,
  getTemplateById,
  saveSystemTemplate,
  updateCustomTemplate,
  type EmailTemplateType,
} from '@/lib/email-templates';

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

export async function updateEmailTemplate(
  type: EmailTemplateType,
  subject: string,
  bodyHtml: string,
): Promise<void> {
  const trimmedSubject = subject.trim();
  const trimmedBody = bodyHtml.trim();
  if (!trimmedSubject || !trimmedBody) {
    throw new Error('Subject and body cannot be empty');
  }

  const user = await getAdminUser();
  const before = await getTemplate(type);

  await saveSystemTemplate(type, trimmedSubject, trimmedBody, user.id);

  const supabase = await createServiceClient();
  // `target_id` is a uuid column — template_type ('approved' etc.) isn't one, so it
  // travels inside before/after_value instead of as the target id.
  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'updated email template',
    targetTable: 'email_templates',
    beforeValue: { template_type: type, subject: before.subject, body_html: before.bodyHtml },
    afterValue: { template_type: type, subject: trimmedSubject, body_html: trimmedBody },
  });

  revalidatePath('/emails');
}

export async function createTemplate(name: string, subject: string, bodyHtml: string): Promise<string> {
  const trimmedName = name.trim();
  const trimmedSubject = subject.trim();
  const trimmedBody = bodyHtml.trim();
  if (!trimmedName || !trimmedSubject || !trimmedBody) {
    throw new Error('Name, subject, and body cannot be empty');
  }

  const user = await getAdminUser();
  const id = await createCustomTemplate(trimmedName, trimmedSubject, trimmedBody, user.id);

  const supabase = await createServiceClient();
  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'created email template',
    targetTable: 'email_templates',
    afterValue: { name: trimmedName, subject: trimmedSubject, body_html: trimmedBody },
  });

  revalidatePath('/emails');
  return id;
}

export async function updateTemplate(id: string, name: string, subject: string, bodyHtml: string): Promise<void> {
  const trimmedName = name.trim();
  const trimmedSubject = subject.trim();
  const trimmedBody = bodyHtml.trim();
  if (!trimmedName || !trimmedSubject || !trimmedBody) {
    throw new Error('Name, subject, and body cannot be empty');
  }

  const user = await getAdminUser();
  const before = await getTemplateById(id);
  if (!before || before.isSystem) {
    throw new Error('Template not found');
  }

  await updateCustomTemplate(id, trimmedName, trimmedSubject, trimmedBody, user.id);

  const supabase = await createServiceClient();
  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'updated email template',
    targetTable: 'email_templates',
    beforeValue: { name: before.name, subject: before.subject, body_html: before.bodyHtml },
    afterValue: { name: trimmedName, subject: trimmedSubject, body_html: trimmedBody },
  });

  revalidatePath('/emails');
}

export async function deleteTemplate(id: string): Promise<void> {
  const user = await getAdminUser();
  const before = await getTemplateById(id);
  if (!before || before.isSystem) {
    throw new Error('Template not found');
  }

  await deleteCustomTemplate(id);

  const supabase = await createServiceClient();
  await writeAuditLog(supabase, {
    adminUserId: user.id,
    action: 'deleted email template',
    targetTable: 'email_templates',
    beforeValue: { name: before.name, subject: before.subject },
  });

  revalidatePath('/emails');
}
