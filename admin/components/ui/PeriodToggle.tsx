'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { DashboardPeriod } from '@/lib/dashboard-period';

const OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'month', label: 'This month' },
  { value: '30d', label: 'Last 30 days' },
  { value: 'all', label: 'All time' },
];

export function PeriodToggle({
  period,
  pending: pendingProp,
}: {
  period: DashboardPeriod;
  pending?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const pending = pendingProp ?? isPending;

  function setPeriod(next: DashboardPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'month') params.delete('period');
    else params.set('period', next);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div
      role="group"
      aria-label="Dashboard period"
      aria-busy={pending}
      className={`inline-flex rounded-sm border border-border-outline bg-bg-surface overflow-hidden ${pending ? 'opacity-70' : ''}`}
    >
      {OPTIONS.map((opt) => {
        const active = period === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPeriod(opt.value)}
            disabled={pending}
            aria-pressed={active}
            className={`min-h-11 px-md font-data text-[12px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:z-10 ${
              active
                ? 'bg-primary text-white'
                : 'text-text-tertiary hover:bg-bg-surface-elevated'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
