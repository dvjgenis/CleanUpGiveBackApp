import { ChevronRightIcon } from '@/components/ui/Icons';
import { MOCK_ORDERS, formatOrderCents, loadOrdersSummary } from '@/lib/orders-data';
import { OrdersClientShell } from './OrdersClientShell';

export default function OrdersPage() {
  const summary = loadOrdersSummary();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Shop Orders</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-md mb-xl">
        {[
          { label: 'Open Orders', value: summary.open },
          { label: 'Total Orders', value: summary.total },
          { label: 'Revenue', value: formatOrderCents(summary.totalRevenueCents) },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">{stat.label}</p>
            <p className="font-data text-[28px] font-semibold text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      <OrdersClientShell orders={MOCK_ORDERS} />

      {/* Stripe link */}
      <div className="mt-lg bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col sm:flex-row sm:items-center justify-between gap-md">
        <div>
          <p className="font-body text-[14px] font-medium text-text-primary">Stripe Dashboard</p>
          <p className="font-body text-[13px] text-text-tertiary">Refunds, disputes, and payment details are managed in Stripe.</p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="interactive h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors inline-flex items-center gap-sm shrink-0"
        >
          Open Stripe
          <ChevronRightIcon className="w-4 h-4" color="currentColor" />
        </a>
      </div>
    </div>
  );
}
