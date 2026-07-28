'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { approveSession, declineSession, adjustHours, saveAdminNotes } from '@/actions/sessions';
import { useSessionHours } from './SessionHoursContext';
import type { Session } from '@/types/database';

interface Props {
  session: Session;
  volunteerId: string;
  volunteerName: string;
}

export function SessionActions({ session, volunteerId, volunteerName }: Props) {
  const router = useRouter();
  const { adjustedHours, setAdjustedHours } = useSessionHours();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [declineReason, setDeclineReason] = useState(session.admin_notes ?? '');
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);
  const [hoursInput, setHoursInput] = useState(
    String(adjustedHours ?? session.adjusted_hours ?? ''),
  );
  const [notesInput, setNotesInput] = useState(session.admin_notes ?? '');
  const [notesSaved, setNotesSaved] = useState(false);

  function run(fn: () => Promise<void>) {
    setError('');
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'An error occurred');
      }
    });
  }

  async function handleApprove() {
    run(() => approveSession(session.id));
  }

  async function handleDecline() {
    run(async () => {
      await declineSession(session.id, declineReason || undefined);
      setShowDeclineConfirm(false);
    });
  }

  async function handleAdjustHours() {
    const h = parseFloat(hoursInput);
    if (isNaN(h) || h < 0) {
      setError('Enter a valid number of hours (e.g. 1.5)');
      return;
    }
    run(async () => {
      await adjustHours(session.id, h);
      setAdjustedHours(h);
      router.refresh();
    });
  }

  async function handleSaveNotes() {
    run(async () => {
      await saveAdminNotes(session.id, notesInput);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    });
  }

  const canApprove = session.status === 'under_review' || session.status === 'not_approved';
  const canDecline = session.status === 'under_review' || session.status === 'approved';

  return (
    <div className="bg-bg-surface border border-border-outline rounded-md p-lg flex flex-col gap-lg sticky top-6">
      <h2 className="font-heading text-[20px] leading-[28px] text-text-primary">Admin Actions</h2>

      {error && (
        <div className="px-md py-sm rounded-sm bg-[#ffd9de] border border-[#ba1a1a] text-[#ba1a1a] font-body text-[14px]">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-sm">
        <p className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase">Status</p>

        {canApprove && (
          <Button
            variant="primary"
            onClick={handleApprove}
            disabled={isPending}
            className="w-full justify-center"
          >
            Approve
          </Button>
        )}

        {canDecline && (
          <Button
            variant="danger"
            onClick={() => setShowDeclineConfirm(!showDeclineConfirm)}
            disabled={isPending}
            className="w-full justify-center"
          >
            Decline
          </Button>
        )}

        <AnimatePresence>
          {showDeclineConfirm && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-sm"
            >
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Reason (optional)"
                rows={3}
                className="w-full rounded-sm border border-border-outline p-sm font-body text-[14px] text-text-primary focus:outline-none focus:border-primary resize-none"
              />
              <div className="flex gap-sm">
                <Button variant="danger" onClick={handleDecline} disabled={isPending} size="sm" className="flex-1 justify-center">
                  {isPending ? 'Declining…' : 'Confirm Decline'}
                </Button>
                <Button variant="ghost" onClick={() => setShowDeclineConfirm(false)} size="sm">
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-sm border-t border-border-outline pt-lg">
        <p className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase">Adjust Hours</p>
        <div className="flex gap-sm">
          <input
            type="number"
            min="0"
            step="0.25"
            value={hoursInput}
            onChange={(e) => setHoursInput(e.target.value)}
            placeholder="e.g. 1.5"
            className="flex-1 h-9 px-sm rounded-sm border border-border-outline font-body text-base text-text-primary focus:outline-none focus:border-primary"
          />
          <Button variant="secondary" size="sm" onClick={handleAdjustHours} disabled={isPending}>
            Save
          </Button>
        </div>
        {adjustedHours != null && (
          <p className="font-body text-[13px] text-primary">Adjusted to {adjustedHours}h</p>
        )}
      </div>

      <div className="flex flex-col gap-sm border-t border-border-outline pt-lg">
        <p className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase">Admin Notes</p>
        <textarea
          value={notesInput}
          onChange={(e) => setNotesInput(e.target.value)}
          rows={4}
          placeholder="Internal notes (not visible to volunteer)"
          className="w-full rounded-sm border border-border-outline p-sm font-body text-[14px] text-text-primary focus:outline-none focus:border-primary resize-none"
        />
        <Button variant="secondary" size="sm" onClick={handleSaveNotes} disabled={isPending} className="self-end">
          {notesSaved ? '✓ Saved' : 'Save Notes'}
        </Button>
      </div>

      <div className="flex flex-col gap-sm border-t border-border-outline pt-lg">
        <p className="font-data text-[12px] text-text-tertiary tracking-[0.96px] uppercase">Letterhead</p>
        {session.letterhead_generated_at ? (
          <p className="font-body text-[13px] text-text-tertiary">
            Last generated: {new Date(session.letterhead_generated_at).toLocaleDateString()}
          </p>
        ) : null}
        <a
          href={`/api/service-letter/${session.id}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={session.status !== 'approved'}
          className={`interactive inline-flex items-center justify-center h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-primary transition-colors ${
            session.status === 'approved'
              ? 'hover:bg-bg-surface-elevated'
              : 'opacity-50 pointer-events-none'
          }`}
        >
          Generate Letterhead (this session)
        </a>
        <a
          href={`/api/service-letter/bulk/${volunteerId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="interactive inline-flex items-center justify-center h-9 px-md rounded-sm border border-border-outline bg-bg-surface font-data text-[12px] font-semibold text-text-primary hover:bg-bg-surface-elevated transition-colors"
        >
          Generate Bulk Letterhead ({volunteerName})
        </a>
      </div>
    </div>
  );
}
