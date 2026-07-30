/**
 * Faithful port of `admin/app/(admin)/feedback/page.tsx` + `FeedbackRow.tsx`.
 *
 * `feedback` is fetched live from the shared Supabase `volunteer_feedback`
 * table by `admin-web-app/src/app/feedback/page.tsx` (see `@/lib/live-data`),
 * falling back to `MOCK_FEEDBACK` when that table has no rows yet.
 */
import { EMOJI_MAP, MOCK_FEEDBACK, type FeedbackEntry } from "@/lib/mock-data";
import { SampleDataBanner } from "@/components/ui/SampleDataBanner";

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function FeedbackRow({ feedback: fb }: { feedback: FeedbackEntry }) {
  const meta = EMOJI_MAP[fb.rating];
  return (
    <div
      className={`bg-bg-surface border rounded-md p-lg ${
        fb.flagged ? "border-[#ba1a1a]/40 bg-[#ffd9de]/20" : "border-border-outline"
      }`}
    >
      <div className="flex items-start justify-between gap-md">
        <div className="flex items-center gap-sm">
          <span className="text-xl" title={meta?.label}>
            {meta?.emoji}
          </span>
          <div>
            <p className="font-body text-[14px] font-semibold text-text-primary">{fb.volunteer}</p>
            <p className="font-data text-[12px] text-text-tertiary">
              {fb.activity} · {formatTime(fb.submittedAt)}
            </p>
          </div>
        </div>
        {fb.flagged ? (
          <span className="font-data text-[11px] font-semibold px-sm py-xs rounded-sm bg-[#ffd9de] text-[#ba1a1a]">
            Flagged
          </span>
        ) : null}
      </div>
      {fb.comment && (
        <p className="font-body text-[14px] text-text-primary mt-md pl-[calc(1.25rem+8px)] border-l-2 border-border-outline ml-[10px]">
          {fb.comment}
        </p>
      )}
    </div>
  );
}

export function FeedbackPage({
  feedback = MOCK_FEEDBACK,
  isMock = false,
}: {
  feedback?: FeedbackEntry[];
  isMock?: boolean;
}) {
  const avg =
    feedback.length > 0
      ? feedback.reduce((sum, f) => sum + (EMOJI_MAP[f.rating]?.score ?? 0), 0) / feedback.length
      : 0;
  const ratingOrder = ["excited", "happy", "neutral", "sad", "very_sad"] as const;
  const distribution = ratingOrder.map((key) => {
    const val = EMOJI_MAP[key];
    const count = feedback.filter((f) => f.rating === key).length;
    return {
      ...val,
      key,
      count,
      pct: feedback.length > 0 ? Math.round((count / feedback.length) * 100) : 0,
    };
  });
  const maxCount = Math.max(0, ...distribution.map((d) => d.count));
  const flagged = feedback.filter((f) => f.flagged).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-lg">
        <h1 className="font-heading text-[28px] leading-[36px] text-text-primary">Feedback</h1>
      </div>

      {isMock && <SampleDataBanner />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-md mb-xl">
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">Avg Rating</p>
          <p className="font-data text-[28px] font-semibold text-primary">
            {avg.toFixed(1)}
            <span className="text-[16px] text-text-tertiary font-normal">/5</span>
          </p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">Total</p>
          <p className="font-data text-[28px] font-semibold text-text-primary">{feedback.length}</p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">Flagged</p>
          <p className={`font-data text-[28px] font-semibold ${flagged > 0 ? "text-[#ba1a1a]" : "text-text-primary"}`}>
            {flagged}
          </p>
        </div>
        <div className="bg-bg-surface border border-border-outline rounded-md p-lg">
          <p className="font-data text-[11px] tracking-[0.88px] uppercase text-text-tertiary mb-sm">With Comment</p>
          <p className="font-data text-[28px] font-semibold text-text-primary">
            {feedback.filter((f) => f.comment).length}
          </p>
        </div>
      </div>

      <div className="bg-bg-surface border border-border-outline rounded-md p-lg mb-xl">
        <p className="font-data text-[12px] tracking-[0.96px] uppercase text-text-tertiary mb-md">
          Rating Distribution
        </p>
        <div className="grid grid-cols-5 gap-md">
          {distribution.map((d) => {
            const barPct = maxCount > 0 ? (d.count / maxCount) * 100 : 0;
            return (
              <div key={d.key} className="flex flex-col items-center gap-xs min-w-0">
                <span className="text-xl sm:text-2xl" aria-hidden>
                  {d.emoji}
                </span>
                <div
                  className="w-full max-w-[40px] h-16 flex flex-col justify-end rounded-sm bg-bg-app overflow-hidden"
                  aria-hidden
                >
                  <div
                    className="w-full rounded-sm transition-[height]"
                    style={{
                      height: `${Math.max(d.count > 0 ? 8 : 0, barPct)}%`,
                      backgroundColor: d.color,
                      opacity: d.count > 0 ? 0.85 : 0.2,
                    }}
                  />
                </div>
                <span className="font-data text-[16px] sm:text-[18px] font-semibold text-text-primary">
                  {d.count}
                </span>
                <span className="font-data text-[10px] text-text-tertiary">{d.pct}%</span>
                <span className="font-data text-[9px] sm:text-[10px] text-text-tertiary text-center leading-tight">
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-sm">
        {feedback.map((fb) => (
          <FeedbackRow key={fb.id} feedback={fb} />
        ))}
      </div>
    </div>
  );
}
