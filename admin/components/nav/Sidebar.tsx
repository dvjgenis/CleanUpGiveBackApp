'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { NavBadges } from '@/lib/nav-badges';
import {
  HomeIcon,
  SessionIcon,
  VolunteerIcon,
  InsightsIcon,
  FeedbackIcon,
  EventIcon,
  OrderIcon,
  PaymentIcon,
  AccountIcon,
  SignOutIcon,
  PanelCollapseIcon,
  PanelExpandIcon,
  type IconProps,
} from '@/components/ui/Icons';

const STORAGE_KEY = 'cugb-admin-sidebar-collapsed';

type NavItem = {
  href: string;
  label: string;
  icon: (props: IconProps) => React.ReactNode;
  badgeKey?: keyof Pick<NavBadges, 'sessionsUnderReview' | 'courtAtRisk' | 'openOrders'>;
};

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: HomeIcon },
  { href: '/sessions', label: 'Sessions', icon: SessionIcon, badgeKey: 'sessionsUnderReview' },
  { href: '/users', label: 'Users', icon: VolunteerIcon, badgeKey: 'courtAtRisk' },
  { href: '/insights', label: 'Insights', icon: InsightsIcon },
  { href: '/feedback', label: 'Feedback', icon: FeedbackIcon },
  { href: '/events', label: 'Events', icon: EventIcon },
  { href: '/orders', label: 'Orders', icon: OrderIcon, badgeKey: 'openOrders' },
  { href: '/payments', label: 'Payments', icon: PaymentIcon },
];

function Badge({ count, label }: { count: number; label: string }) {
  // Temporarily hidden — re-enable when notification counts are product-ready.
  void count;
  void label;
  return null;
}

export function Sidebar({ badges }: { badges: NavBadges }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // ignore private-mode / blocked storage
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignore
      }
      return next;
    });
  }

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

  const linkBase =
    'flex items-center min-h-11 rounded-sm font-data text-[12px] font-semibold leading-[18px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';
  const linkActive = 'bg-[#f7fff1] text-primary border border-primary/30';
  const linkIdle = 'text-text-tertiary hover:text-text-primary hover:bg-bg-app border border-transparent';

  return (
    <aside
      className={`hidden lg:flex flex-col h-screen sticky top-0 bg-bg-surface-elevated border-r border-border-outline shrink-0 overflow-hidden transition-[width] duration-200 ease-out ${
        collapsed ? 'w-[4.5rem]' : 'w-60'
      }`}
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div
        className={`h-16 flex items-center border-b border-border-outline shrink-0 ${
          collapsed ? 'justify-center px-sm' : 'px-lg gap-sm'
        }`}
      >
        <Link
          href="/"
          className={`flex items-center min-w-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-sm ${
            collapsed ? 'justify-center' : 'gap-sm flex-1'
          }`}
          title={collapsed ? 'Clean Up – Give Back Admin' : undefined}
        >
          <img
            src="/logo.png"
            alt="Clean Up – Give Back"
            width={32}
            height={32}
            className="w-8 h-8 rounded shrink-0 object-cover"
          />
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-heading text-[14px] leading-[18px] text-text-primary truncate">
                CleanUpGiveBack
              </p>
              <p className="font-data text-[10px] text-text-tertiary tracking-widest uppercase">Admin</p>
            </div>
          )}
        </Link>
      </div>

      <nav
        id="admin-sidebar-nav"
        className="flex-1 min-h-0 py-md px-sm overflow-y-auto overflow-x-hidden"
        aria-label="Main navigation"
      >
        <ul className="flex flex-col gap-xs" role="list">
          {NAV_ITEMS.map((item) => {
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
              <li key={item.href}>
                <Link
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  className={`${linkBase} ${active ? linkActive : linkIdle} ${
                    collapsed ? 'justify-center px-0' : 'gap-sm px-md'
                  }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.icon className="w-4 h-4 shrink-0" aria-hidden />
                  {!collapsed && (
                    <>
                      {item.label}
                      <Badge count={count} label={badgeLabel} />
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-md pt-md border-t border-border-outline flex flex-col gap-xs">
          <Link
            href="/account"
            title={collapsed ? 'Account — Donna Adam' : undefined}
            aria-label={collapsed ? 'Account — Donna Adam' : undefined}
            className={`${linkBase} ${
              isActive('/account') ? linkActive : 'text-text-tertiary hover:text-text-primary hover:bg-bg-app'
            } ${collapsed ? 'justify-center px-0' : 'gap-sm px-md'}`}
            aria-current={isActive('/account') ? 'page' : undefined}
          >
            {collapsed ? (
              <span
                className="w-7 h-7 rounded-full bg-primary text-white font-data text-[10px] font-semibold inline-flex items-center justify-center shrink-0"
                aria-hidden
              >
                DA
              </span>
            ) : (
              <>
                <span
                  className="w-7 h-7 rounded-full bg-primary text-white font-data text-[10px] font-semibold inline-flex items-center justify-center shrink-0"
                  aria-hidden
                >
                  DA
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate">Account</span>
                  <span className="block font-normal text-[10px] text-text-tertiary truncate">Donna Adam</span>
                </span>
                <AccountIcon className="w-4 h-4 shrink-0 opacity-70" />
              </>
            )}
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            title={collapsed ? 'Sign out' : undefined}
            aria-label={collapsed ? 'Sign out' : undefined}
            className={`w-full ${linkBase} text-text-tertiary hover:text-text-primary hover:bg-bg-app ${
              collapsed ? 'justify-center px-0' : 'gap-sm px-md'
            }`}
          >
            <SignOutIcon className="w-4 h-4 shrink-0" />
            {!collapsed && 'Sign out'}
          </button>
        </div>
      </nav>

      <div className={`shrink-0 border-t border-border-outline p-sm ${collapsed ? 'flex justify-center' : ''}`}>
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-expanded={!collapsed}
          aria-controls="admin-sidebar-nav"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={`interactive min-h-11 rounded-sm text-text-tertiary hover:text-text-primary hover:bg-bg-app transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary inline-flex items-center ${
            collapsed ? 'justify-center w-11' : 'w-full gap-sm px-md font-data text-[12px] font-semibold'
          }`}
        >
          {collapsed ? (
            <PanelExpandIcon className="w-4 h-4" aria-hidden />
          ) : (
            <>
              <PanelCollapseIcon className="w-4 h-4 shrink-0" aria-hidden />
              Collapse
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
