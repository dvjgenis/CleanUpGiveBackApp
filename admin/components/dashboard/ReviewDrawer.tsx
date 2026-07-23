'use client';

import { useEffect, useId, useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ReviewableSession } from '@/components/dashboard/types';

interface ReviewDrawerProps {
  open: boolean;
  session: ReviewableSession | null;
  queue: ReviewableSession[];
  isMock: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onDeclineRequest: (id: string) => void;
  busyId: string | null;
}

export function ReviewDrawer({
  open,
  session,
  queue,
  isMock,
  onClose,
  onSelect,
  onApprove,
  onDeclineRequest,
  busyId,
}: ReviewDrawerProps) {
  const titleId = useId();
  const [step, setStep] = useState<'summary' | 'decide'>('summary');

  useEffect(() => {
    if (open) setStep('summary');
  }, [open, session?.id]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (!session) return;
      const idx = queue.findIndex((s) => s.id === session.id);
      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        const next = queue[idx + 1];
        if (next) onSelect(next.id);
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        const prev = queue[idx - 1];
        if (prev) onSelect(prev.id);
      } else if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        onApprove(session.id);
      } else if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        onDeclineRequest(session.id);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, session, queue, onClose, onSelect, onApprove, onDeclineRequest]);

  if (!open || !session) return null;

  const hours =
    session.adjusted_hours != null
      ? `${session.adjusted_hours.toFixed(1)}h`
      : session.duration_seconds
        ? `${(session.duration_seconds / 3600).toFixed(1)}h`
        : '—';

  return (
    <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <button
        type="button"
        className="absolute inset-0 bg-[var(--color-overlay-scrim)]"
        aria-label="Close review panel"
        onClick={onClose}
      />
      <aside className="relative w-full max-w-md h-full bg-bg-surface border-l border-border-outline shadow-bar-top flex flex-col animate-in">
        <header className="px-lg py-md border-b border-border-outline flex items-start justify-between gap-md">
          <div className="min-w-0">
            <p id={titleId} className="font-heading text-[20px] text-text-primary truncate">
              {session.volunteer_name}
            </p>
            <p className="font-body text-[13px] text-text-tertiary truncate">
              {session.activity ?? 'Cleanup session'} · {session.ageLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-sm hover:bg-bg-surface-elevated focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="px-lg py-sm border-b border-border-outline flex gap-sm">
          <button
            type="button"
            onClick={() => setStep('summary')}
            className={`min-h-11 px-md rounded-sm font-data text-[12px] font-semibold ${
              step === 'summary' ? 'bg-[#f7fff1] text-primary' : 'text-text-tertiary'
            }`}
          >
            1. Summary
          </button>
          <button
            type="button"
            onClick={() => setStep('decide')}
            className={`min-h-11 px-md rounded-sm font-data text-[12px] font-semibold ${
              step === 'decide' ? 'bg-[#f7fff1] text-primary' : 'text-text-tertiary'
            }`}
          >
            2. Decide
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-lg py-lg flex flex-col gap-lg">
          {step === 'summary' ? (
            <>
              <div className="grid grid-cols-2 gap-md">
                <Stat label="Duration" value={hours} />
                <Stat
                  label="Distance"
                  value={session.distance_miles != null ? `${session.distance_miles.toFixed(1)} mi` : '—'}
                />
                <Stat label="Type" value={session.court_ordered ? 'Court-ordered' : 'Voluntary'} />
                <Stat label="Submitted" value={session.ageLabel} />
              </div>
              <div>
                <p className="font-data text-[11px] uppercase tracking-[0.88px] text-text-tertiary mb-sm">
                  Evidence
                </p>
                <div className="grid grid-cols-2 gap-sm">
                  <div className="aspect-[3/4] rounded-md bg-bg-surface-elevated border border-border-outline flex items-center justify-center font-body text-[12px] text-text-tertiary">
                    Selfie
                  </div>
                  <div className="aspect-[3/4] rounded-md bg-bg-surface-elevated border border-border-outline flex items-center justify-center font-body text-[12px] text-text-tertiary">
                    Progress
                  </div>
                </div>
                {isMock && (
                  <p className="mt-sm font-body text-[12px] text-text-tertiary">
                    Photo placeholders — live sessions show signed Storage URLs.
                  </p>
                )}
              </div>
              <Button type="button" onClick={() => setStep('decide')}>
                Continue to decide
              </Button>
            </>
          ) : (
            <>
              <p className="font-body text-[14px] text-text-tertiary">
                Keyboard: <kbd className="font-data">J</kbd>/<kbd className="font-data">K</kbd> next/prev ·{' '}
                <kbd className="font-data">A</kbd> approve · <kbd className="font-data">D</kbd> decline ·{' '}
                <kbd className="font-data">Esc</kbd> close
              </p>
              {isMock ? (
                <p className="font-body text-[14px] text-text-tertiary bg-bg-surface-elevated border border-border-outline rounded-md px-md py-md">
                  Demo mode — decisions update the queue locally only.
                </p>
              ) : null}
              <div className="flex flex-col gap-sm">
                <Button
                  type="button"
                  disabled={busyId === session.id}
                  onClick={() => onApprove(session.id)}
                >
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  disabled={busyId === session.id}
                  onClick={() => onDeclineRequest(session.id)}
                >
                  Decline…
                </Button>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-outline bg-bg-surface-elevated px-md py-sm">
      <p className="font-data text-[10px] uppercase tracking-[0.8px] text-text-tertiary">{label}</p>
      <p className="font-data text-[14px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}
