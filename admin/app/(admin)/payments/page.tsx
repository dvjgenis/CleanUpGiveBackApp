import { ChevronRightIcon } from '@/components/ui/Icons';
import { KPICard } from '@/components/ui/KPICard';
import { RevenueBarChart } from '@/components/ui/RevenueBarChart';
import { formatCents, loadPaymentsSummary } from '@/lib/payments-data';

export default async function PaymentsPage() {
  const summary = await loadPaymentsSummary();

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Payments</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          Donation and shop revenue for {summary.monthLabel}. Refunds and disputes stay in Stripe.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-md mb-xl">
        <KPICard
          label="Donations this month"
          value={formatCents(summary.donationsThisMonthCents)}
          subtext="Contribute gifts"
          index={0}
        />
        <KPICard
          label="Shop revenue this month"
          value={formatCents(summary.shopThisMonthCents)}
          subtext={summary.shopFromDb ? 'From shop orders' : 'Merchandise + kits'}
          index={1}
          href="/orders"
          showChevron
        />
        <KPICard
          label="Total this month"
          value={formatCents(summary.totalThisMonthCents)}
          subtext="Donations + shop"
          index={2}
        />
      </div>

      <div className="mb-xl">
        <RevenueBarChart
          title="Monthly trend"
          subtitle="Last 6 months — donations stacked with shop revenue"
          data={summary.monthly}
          index={0}
        />
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <p className="font-body text-[14px] font-medium text-text-primary">Stripe Dashboard</p>
          <p className="font-body text-[13px] text-text-tertiary">
            Manage refunds, disputes, and payout details in Stripe. Full in-app Stripe tools ship in
            v2.
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="interactive h-11 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors inline-flex items-center justify-center gap-sm shrink-0"
        >
          Manage in Stripe
          <ChevronRightIcon className="w-4 h-4" color="currentColor" />
        </a>
      </div>
    </div>
  );
}
