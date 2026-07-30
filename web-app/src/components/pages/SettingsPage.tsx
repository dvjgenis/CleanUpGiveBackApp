/**
 * Admin has no dedicated Settings nav page, so this is not a port of any
 * specific admin route — just a placeholder that stays visually consistent
 * with the shared design tokens (loosely modeled on the Account page's
 * card/typography style, per the task's explicit guidance not to fabricate
 * "real" admin copy for a page that doesn't exist).
 */
export function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Settings</h1>
        <p className="mt-xs font-body text-[14px] text-text-tertiary">
          Preferences and notifications for the CleanUpGiveBack admin portal.
        </p>
      </header>

      <section className="bg-bg-surface border border-border-outline rounded-md overflow-hidden">
        <div className="px-lg py-md border-b border-border-outline">
          <h2 className="font-heading text-[18px] text-text-primary">Notifications</h2>
        </div>
        <div className="divide-y divide-border-outline">
          {[
            { label: "New session submissions", value: "Email + in-app" },
            { label: "Court hours at risk", value: "Email" },
            { label: "Weekly summary", value: "Email" },
          ].map((row) => (
            <div key={row.label} className="px-lg py-md flex items-center justify-between gap-md">
              <span className="font-body text-[14px] text-text-primary">{row.label}</span>
              <span className="font-data text-[12px] text-text-tertiary">{row.value}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-lg font-body text-[13px] text-text-tertiary">
        This is a placeholder page — admin has no dedicated Settings route today.
      </p>
    </div>
  );
}
