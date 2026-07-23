const MOCK_ORDERS = [
  { id: 'o1', volunteer: 'Jordan Kim', email: 'jordan.k@email.com', items: 'Water Bottle × 1, Cap × 1', totalCents: 3499, status: 'shipped', tracking: '9400111202550035000000', carrier: 'USPS', createdAt: '2026-07-15T10:22:00Z' },
  { id: 'o2', volunteer: 'Devon Okafor', email: 'devon.o@email.com', items: 'Tote Bag × 2', totalCents: 2998, status: 'delivered', tracking: '9400111202550035111111', carrier: 'USPS', createdAt: '2026-07-12T14:05:00Z' },
  { id: 'o3', volunteer: 'Sophia Chen', email: 'sophia.c@email.com', items: 'Cap × 1', totalCents: 1499, status: 'paid', tracking: null, carrier: null, createdAt: '2026-07-18T09:00:00Z' },
  { id: 'o4', volunteer: 'Marcus Rivera', email: 'marcus.r@email.com', items: 'Water Bottle × 2, Tote Bag × 1', totalCents: 5497, status: 'pending', tracking: null, carrier: null, createdAt: '2026-07-20T16:30:00Z' },
  { id: 'o5', volunteer: 'Luna Martinez', email: 'luna.m@email.com', items: 'Gloves × 3', totalCents: 2997, status: 'shipped', tracking: '9400111202550035222222', carrier: 'UPS', createdAt: '2026-07-16T11:10:00Z' },
  { id: 'o6', volunteer: 'Miguel Santos', email: 'miguel.s@email.com', items: 'Water Bottle × 1', totalCents: 1999, status: 'delivered', tracking: '9400111202550035333333', carrier: 'USPS', createdAt: '2026-07-10T08:45:00Z' },
  { id: 'o7', volunteer: 'Fatima Hassan', email: 'fatima.h@email.com', items: 'Cap × 2, Tote Bag × 1', totalCents: 4497, status: 'pending', tracking: null, carrier: null, createdAt: '2026-07-21T07:55:00Z' },
  { id: 'o8', volunteer: 'Tyler Washington', email: 'tyler.w@email.com', items: 'Gloves × 1', totalCents: 999, status: 'cancelled', tracking: null, carrier: null, createdAt: '2026-07-11T13:20:00Z' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-[#ffddb5] text-[#835400] border-[#fcab29]/40' },
  paid: { label: 'Paid', className: 'bg-[#f7fff1] text-primary border-primary/30' },
  shipped: { label: 'Shipped', className: 'bg-[#e8f4fe] text-[#1565c0] border-[#1565c0]/30' },
  delivered: { label: 'Delivered', className: 'bg-[#f7fff1] text-primary border-primary/30' },
  cancelled: { label: 'Cancelled', className: 'bg-[#ffd9de] text-[#ba1a1a] border-[#ba1a1a]/30' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrdersPage() {
  const open = MOCK_ORDERS.filter((o) => ['pending', 'paid', 'shipped'].includes(o.status)).length;
  const totalRevenue = MOCK_ORDERS.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + o.totalCents, 0);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Shop Orders</h1>
        <span className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary bg-bg-surface-elevated border border-border-outline rounded-sm px-sm py-xs">
          Mock data
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-md mb-xl">
        {[
          { label: 'Open Orders', value: open },
          { label: 'Total Orders', value: MOCK_ORDERS.length },
          { label: 'Revenue', value: formatCents(totalRevenue) },
        ].map((stat) => (
          <div key={stat.label} className="bg-bg-surface border border-border-outline rounded-md p-lg">
            <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">{stat.label}</p>
            <p className="font-data text-[28px] font-semibold text-text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-md px-lg py-sm bg-bg-surface-elevated border-b border-border-outline">
          {['Volunteer', 'Items', 'Date', 'Total', 'Status'].map((col) => (
            <span key={col} className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary">{col}</span>
          ))}
        </div>
        <ul role="list" className="divide-y divide-border-outline">
          {MOCK_ORDERS.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            return (
              <li key={order.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-md items-center px-lg py-md table-row-hover transition-colors">
                <div>
                  <p className="font-body text-[14px] font-medium text-text-primary">{order.volunteer}</p>
                  <p className="font-body text-[12px] text-text-tertiary">{order.email}</p>
                </div>
                <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap max-w-[180px] truncate">{order.items}</span>
                <span className="font-data text-[13px] text-text-tertiary whitespace-nowrap">{formatDate(order.createdAt)}</span>
                <span className="font-data text-[13px] font-semibold text-text-primary whitespace-nowrap">{formatCents(order.totalCents)}</span>
                <span className={`font-data text-[11px] font-semibold px-sm py-xs rounded-xs border whitespace-nowrap ${cfg.className}`}>
                  {cfg.label}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Stripe link */}
      <div className="mt-lg bg-bg-surface border border-border-outline rounded-md p-lg flex items-center justify-between gap-md">
        <div>
          <p className="font-body text-[14px] font-medium text-text-primary">Stripe Dashboard</p>
          <p className="font-body text-[13px] text-text-tertiary">Refunds, disputes, and payment details are managed in Stripe.</p>
        </div>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="interactive h-10 px-lg rounded-sm bg-primary text-white font-data text-[13px] font-semibold hover:bg-[#007d35] transition-colors flex items-center gap-sm shrink-0"
        >
          Open Stripe →
        </a>
      </div>
    </div>
  );
}
