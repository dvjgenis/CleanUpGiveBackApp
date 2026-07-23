'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import type { NavBadges } from '@/lib/nav-badges';

const PRIMARY_NAV = [
  { href: '/', label: 'Dashboard', badgeKey: null as null },
  { href: '/sessions', label: 'Sessions', badgeKey: 'sessionsUnderReview' as const },
  { href: '/volunteers', label: 'Volunteers', badgeKey: null as null },
  { href: '/court-hours', label: 'Court Hours', badgeKey: 'courtAtRisk' as const },
];

const MORE_NAV = [
  { href: '/feedback', label: 'Feedback', demoted: false },
  { href: '/events', label: 'Events', demoted: false },
  { href: '/orders', label: 'Orders', demoted: false, badgeKey: 'openOrders' as const },
  { href: '/payments', label: 'Payments', demoted: true },
  { href: '/audit-log', label: 'Audit Log', demoted: false },
];

function MiniBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1 -right-2 min-w-4 h-4 px-0.5 rounded-full bg-[#ba1a1a] text-white font-data text-[9px] font-semibold inline-flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}

export function MobileNav({ badges }: { badges: NavBadges }) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  const moreItems = MORE_NAV.filter((item) => !item.demoted || badges.showPayments);
  const demoted = MORE_NAV.filter((item) => item.demoted && !badges.showPayments);

  return (
    <>
      <header className="lg:hidden h-14 bg-bg-surface-elevated border-b border-border-outline flex items-center justify-between px-lg shadow-bar-top">
        <div className="flex items-center gap-sm">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2L4 7v10l8 5 8-5V7L12 2z" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-heading text-[16px] text-text-primary">Admin</span>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="interactive min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm hover:bg-bg-app transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            {menuOpen ? (
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            ) : (
              <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="lg:hidden fixed inset-0 z-40 bg-[var(--color-overlay-scrim)]"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="lg:hidden fixed top-0 right-0 bottom-0 z-50 w-64 bg-bg-surface flex flex-col"
            >
              <div className="h-14 flex items-center justify-between px-lg border-b border-border-outline">
                <span className="font-heading text-[16px]">Menu</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="min-h-11 min-w-11 inline-flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto py-md px-sm">
                {[...PRIMARY_NAV.map((i) => ({ ...i, demoted: false })), ...moreItems].map((item) => {
                  const count =
                    'badgeKey' in item && item.badgeKey ? badges[item.badgeKey] : 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-center justify-between min-h-11 px-md rounded-sm font-data text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                        isActive(item.href)
                          ? 'bg-[#f7fff1] text-primary'
                          : 'text-text-tertiary hover:bg-bg-surface-elevated hover:text-text-primary'
                      }`}
                    >
                      <span>{item.label}</span>
                      {count > 0 && (
                        <span className="min-w-5 h-5 px-1 rounded-full bg-[#ba1a1a] text-white font-data text-[10px] inline-flex items-center justify-center">
                          {count}
                        </span>
                      )}
                    </Link>
                  );
                })}
                {demoted.length > 0 && (
                  <>
                    <p className="px-md mt-md mb-xs font-data text-[10px] uppercase tracking-[0.88px] text-text-tertiary">
                      Coming soon
                    </p>
                    {demoted.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center min-h-11 px-md rounded-sm font-data text-[12px] text-text-tertiary/70"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </>
                )}
              </nav>
              <div className="p-sm border-t border-border-outline">
                <button
                  onClick={handleSignOut}
                  className="w-full min-h-11 px-md text-left rounded-sm font-data text-[12px] font-semibold text-text-tertiary hover:bg-bg-surface-elevated transition-colors"
                >
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-bg-surface border-t border-border-outline shadow-nav-bottom">
        <ul className="flex" role="list">
          {PRIMARY_NAV.map((item) => {
            const count = item.badgeKey ? badges[item.badgeKey] : 0;
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={`relative flex flex-col items-center justify-center min-h-14 gap-1 font-data text-[11px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${
                    isActive(item.href) ? 'text-primary' : 'text-text-tertiary'
                  }`}
                >
                  <span className="relative text-[18px] leading-none" aria-hidden>
                    {item.href === '/'
                      ? '⌂'
                      : item.href === '/sessions'
                        ? '☰'
                        : item.href === '/volunteers'
                          ? '☺'
                          : '⚖'}
                    <MiniBadge count={count} />
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
          <li className="flex-1">
            <button
              onClick={() => setMenuOpen(true)}
              className="w-full flex flex-col items-center justify-center min-h-14 gap-1 font-data text-[11px] font-semibold text-text-tertiary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="text-[18px] leading-none" aria-hidden>
                ···
              </span>
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
