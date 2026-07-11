export function formatPhotoTimeLabel(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp));
}

export function formatSessionDateLabel(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp));
}

export function formatSessionTimeRange(startedAt: number, endedAt: number): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${formatter.format(new Date(startedAt))} - ${formatter.format(new Date(endedAt))}`;
}

export function formatDurationParts(elapsedSeconds: number): { hours: number; minutes: number } {
  const hours = Math.floor(elapsedSeconds / 3600);
  const minutes = Math.floor((elapsedSeconds % 3600) / 60);
  return { hours, minutes };
}

export function getCheckpointLabel(index: number, total: number): string {
  if (total <= 1) {
    return 'Checkpoint Photo';
  }
  if (index === 0) {
    return 'Start Photo';
  }
  if (index === total - 1) {
    return 'End Photo';
  }
  return 'Midpoint Photo';
}

/** Live tracker copy — e.g. `2 photos submitted`. Empty when count is 0. */
export function formatSubmittedCheckpointCount(count: number): string {
  if (count <= 0) {
    return '';
  }

  return count === 1 ? '1 photo submitted' : `${count} photos submitted`;
}

type CheckpointSubmissionLike = { submittedEarly: boolean };

/** Count of checkpoint photos taken before the 30-minute window expired. */
export function countEarlyCheckpointSubmissions(
  checkpoints: readonly CheckpointSubmissionLike[],
): number {
  return checkpoints.filter((checkpoint) => checkpoint.submittedEarly).length;
}

/** Show submission tally in the live checkpoint card only after at least one early submit. */
export function shouldShowCheckpointSubmissionCount(
  checkpoints: readonly CheckpointSubmissionLike[],
): boolean {
  return countEarlyCheckpointSubmissions(checkpoints) > 0;
}

/** 1-based ordinal for photo-submitted confirmation — `1st`, `2nd`, `3rd`, `4th`, … */
/** Home recent-sessions card — e.g. `Oct 24`. */
export function formatRecentSessionDateLabel(timestamp: number): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

function formatRecentSessionClock(timestamp: number, includePeriod: boolean): string {
  const date = new Date(timestamp);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  const clock = `${hour12}:${minutes.toString().padStart(2, '0')}`;
  return includePeriod ? `${clock} ${period}` : clock;
}

/** Home recent-sessions card — e.g. `9:00-11:00 AM`. */
export function formatRecentSessionTimeLabel(startedAt: number, endedAt: number): string {
  return `${formatRecentSessionClock(startedAt, false)}-${formatRecentSessionClock(endedAt, true)}`;
}

/** Home recent-sessions card — e.g. `2.5 hrs`. */
export function formatRecentSessionDurationLabel(elapsedSeconds: number): string {
  const hours = elapsedSeconds / 3600;
  return `${hours.toFixed(1)} hrs`;
}

export function formatCheckpointOrdinal(oneBasedIndex: number): string {
  const mod100 = oneBasedIndex % 100;
  const mod10 = oneBasedIndex % 10;

  if (mod100 >= 11 && mod100 <= 13) {
    return `${oneBasedIndex}th`;
  }

  if (mod10 === 1) {
    return `${oneBasedIndex}st`;
  }

  if (mod10 === 2) {
    return `${oneBasedIndex}nd`;
  }

  if (mod10 === 3) {
    return `${oneBasedIndex}rd`;
  }

  return `${oneBasedIndex}th`;
}
