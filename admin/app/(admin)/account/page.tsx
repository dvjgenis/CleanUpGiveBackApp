import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AccountSignOut } from './AccountSignOut';

/** Org contact — override via env so the repo is not a PII store. */
const ADMIN_PROFILE = {
  name: process.env.ADMIN_DISPLAY_NAME ?? 'Donna Adam',
  title: process.env.ADMIN_DISPLAY_TITLE ?? 'Executive Director',
  role: 'Administrator',
  organization: process.env.ADMIN_ORG_NAME ?? 'Clean Up – Give Back .Org',
  email: process.env.DONNA_EMAIL ?? 'donnaadam@cleanupgiveback.org',
  phone: process.env.ADMIN_ORG_PHONE ?? '',
  address: process.env.ADMIN_ORG_ADDRESS ?? '',
} as const;

export default async function AccountPage() {
  let email: string = ADMIN_PROFILE.email;
  let lastSignIn: string | null = null;

  if (process.env.BYPASS_AUTH !== 'true') {
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) email = user.email;
      if (user?.last_sign_in_at) {
        lastSignIn = new Date(user.last_sign_in_at).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        });
      }
    } catch {
      // Keep org defaults when auth client is unavailable (e.g. local bypass gaps).
    }
  }

  const fields: { label: string; value: string }[] = [
    { label: 'Name', value: ADMIN_PROFILE.name },
    { label: 'Title', value: ADMIN_PROFILE.title },
    { label: 'Role', value: ADMIN_PROFILE.role },
    { label: 'Organization', value: ADMIN_PROFILE.organization },
    { label: 'Email', value: email },
  ];
  if (ADMIN_PROFILE.phone) {
    fields.push({ label: 'Phone', value: ADMIN_PROFILE.phone });
  }
  if (ADMIN_PROFILE.address) {
    fields.push({ label: 'Address', value: ADMIN_PROFILE.address });
  }

  if (lastSignIn) {
    fields.push({ label: 'Last sign-in', value: lastSignIn });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Account</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          Your admin profile for the CleanUpGiveBack portal.
        </p>
      </header>

      <section
        aria-labelledby="account-profile-heading"
        className="bg-bg-surface border border-border-outline rounded-md overflow-hidden"
      >
        <div className="px-lg py-lg flex items-center gap-md border-b border-border-outline">
          <span
            className="w-14 h-14 rounded-full bg-primary text-white font-data text-[18px] font-semibold inline-flex items-center justify-center shrink-0"
            aria-hidden
          >
            DA
          </span>
          <div className="min-w-0">
            <h2
              id="account-profile-heading"
              className="font-heading text-[22px] leading-[28px] text-text-primary truncate"
            >
              {ADMIN_PROFILE.name}
            </h2>
            <p className="font-data text-[12px] text-text-tertiary">
              {ADMIN_PROFILE.title} · {ADMIN_PROFILE.role}
            </p>
          </div>
        </div>

        <dl className="divide-y divide-border-outline">
          {fields.map((field) => (
            <div
              key={field.label}
              className="px-lg py-md grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-xs sm:gap-md"
            >
              <dt className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary">
                {field.label}
              </dt>
              <dd className="font-body text-[14px] text-text-primary break-words">{field.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-lg flex flex-col gap-md">
        <AccountSignOut />
        <Link
          href="/audit-log"
          className="font-data text-[12px] font-semibold text-text-tertiary hover:text-primary hover:underline inline-flex items-center gap-xs w-fit"
        >
          View audit log
        </Link>
      </div>
    </div>
  );
}
