export default function PaymentsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="font-heading text-[28px] leading-[36px] text-text-primary mb-lg">Payments</h1>
      <div className="bg-bg-surface border border-border-outline rounded-md p-xl flex flex-col items-center gap-md">
        <p className="font-body text-base text-text-tertiary">Full Stripe integration is deferred to v2.</p>
        <a
          href="https://dashboard.stripe.com"
          target="_blank"
          rel="noopener noreferrer"
          className="interactive h-11 px-lg rounded-sm bg-primary text-white font-data text-base font-semibold inline-flex items-center gap-sm hover:bg-[#007d35] transition-colors"
        >
          Manage in Stripe →
        </a>
      </div>
    </div>
  );
}
