'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { NavBadges } from '@/lib/nav-badges';

type NavItem = {
  href: string;
  label: string;
  icon: (props: { className?: string }) => React.ReactNode;
  badgeKey?: keyof Pick<NavBadges, 'sessionsUnderReview' | 'courtAtRisk' | 'openOrders'>;
  demoted?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: HomeIcon },
  { href: '/sessions', label: 'Sessions', icon: SessionIcon, badgeKey: 'sessionsUnderReview' },
  { href: '/volunteers', label: 'Volunteers', icon: VolunteerIcon },
  { href: '/court-hours', label: 'Court Hours', icon: CourtIcon, badgeKey: 'courtAtRisk' },
  { href: '/feedback', label: 'Feedback', icon: FeedbackIcon },
  { href: '/events', label: 'Events', icon: EventIcon },
  { href: '/orders', label: 'Orders', icon: OrderIcon, badgeKey: 'openOrders' },
  { href: '/payments', label: 'Payments', icon: PaymentIcon, demoted: true },
  { href: '/audit-log', label: 'Audit Log', icon: AuditIcon },
];

function Badge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span
      className="ml-auto min-w-5 h-5 px-1 rounded-full bg-[#ba1a1a] text-white font-data text-[10px] font-semibold inline-flex items-center justify-center"
      aria-label={`${count} ${label}`}
    >
      <span aria-hidden>{count > 99 ? '99+' : count}</span>
    </span>
  );
}

export function Sidebar({ badges }: { badges: NavBadges }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const primary = NAV_ITEMS.filter((item) => !item.demoted || badges.showPayments);
  const demoted = NAV_ITEMS.filter((item) => item.demoted && !badges.showPayments);

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-bg-surface-elevated border-r border-border-outline shrink-0">
      <div className="h-16 flex items-center px-lg border-b border-border-outline">
        <div className="flex items-center gap-sm">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-heading text-[14px] leading-[18px] text-text-primary">CleanUpGiveBack</p>
            <p className="font-data text-[10px] text-text-tertiary tracking-widest uppercase">Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-md px-sm overflow-y-auto" aria-label="Main navigation">
        <ul className="flex flex-col gap-xs" role="list">
          {primary.map((item) => {
            const active = isActive(item.href);
            const count = item.badgeKey ? badges[item.badgeKey] : 0;
            const badgeLabel =
              item.badgeKey === 'sessionsUnderReview'
                ? 'under review'
                : item.badgeKey === 'courtAtRisk'
                  ? 'at risk'
                  : item.badgeKey === 'openOrders'
                    ? 'open orders'
                    : 'items';
            return (
              <li key={item.href} className="relative">
                {active && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-[#f7fff1] rounded-sm border border-primary/30"
                    transition={{ duration: 0.3, bounce: 0.15, type: 'spring' }}
                  />
                )}
                <Link
                  href={item.href}
                  className={`relative flex items-center gap-sm min-h-11 px-md rounded-sm font-data text-[12px] font-semibold leading-[18px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    active ? 'text-primary' : 'text-text-tertiary hover:text-text-primary hover:bg-bg-app'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" aria-hidden />
                  {item.label}
                  <Badge count={count} label={badgeLabel} />
                </Link>
              </li>
            );
          })}
        </ul>

        {demoted.length > 0 && (
          <div className="mt-lg pt-md border-t border-border-outline">
            <p className="px-md mb-xs font-data text-[10px] tracking-[0.88px] uppercase text-text-tertiary">
              Coming soon
            </p>
            <ul className="flex flex-col gap-xs" role="list">
              {demoted.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-sm min-h-11 px-md rounded-sm font-data text-[12px] text-text-tertiary/70 hover:text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className="p-sm border-t border-border-outline">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-sm min-h-11 px-md rounded-sm text-text-tertiary hover:text-text-primary hover:bg-bg-app font-data text-[12px] font-semibold leading-[18px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <SignOutIcon className="w-4 h-4 shrink-0" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9.5L10 3l7 6.5V17a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" strokeLinejoin="round" />
      <path d="M8 18v-6h4v6" />
    </svg>
  );
}
function SessionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="14" height="14" rx="2" />
      <path d="M7 7h6M7 10h6M7 13h4" strokeLinecap="round" />
    </svg>
  );
}
function VolunteerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="7" r="3" />
      <path d="M4 17c0-3.314 2.686-6 6-6s6 2.686 6 6" strokeLinecap="round" />
    </svg>
  );
}
function CourtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 3v14M3 10h14" strokeLinecap="round" />
      <circle cx="10" cy="10" r="7" />
    </svg>
  );
}
function FeedbackIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V5a1 1 0 011-1z" strokeLinejoin="round" />
    </svg>
  );
}
function EventIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="14" height="12" rx="2" />
      <path d="M7 3v4M13 3v4M3 9h14" strokeLinecap="round" />
    </svg>
  );
}
function OrderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 4h2l2.5 8h7L17 7H6" strokeLinejoin="round" />
      <circle cx="9" cy="16" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="15" cy="16" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
function PaymentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="5" width="16" height="12" rx="2" />
      <path d="M2 9h16" strokeLinecap="round" />
    </svg>
  );
}
function AuditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 3H4a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1v-5" strokeLinecap="round" />
      <path d="M14 3l3 3-7 7-3 .5.5-3L14 3z" strokeLinejoin="round" />
    </svg>
  );
}
function SignOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 3h4v14h-4M9 13l4-3-4-3M13 10H5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
