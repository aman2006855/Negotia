'use client';

import { useRouter } from 'next/navigation';
import { useBoard } from '@/lib/store';
import type { FeedJob } from '@/lib/types';
import { LockIcon, ClockIcon, BellIcon } from './icons';
import { formatBudget } from '@/lib/constants';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; overlay?: string }> = {
  OPEN: { label: 'Available', badge: 'bg-success-50 text-success-600 dark:bg-success-50/20 dark:text-success-500' },
  NEGOTIATING: { label: 'Negotiating', badge: 'bg-warning-50 text-warning-600 dark:bg-warning-50/20 dark:text-warning-500' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-accent-50 text-accent-700 dark:bg-accent-50/20 dark:text-accent-400' },
  COMPLETED: { label: 'Completed', badge: 'bg-inset text-txt-tertiary' },
  CANCELLED: { label: 'Cancelled', badge: 'bg-danger-50 text-danger-600 dark:bg-danger-50/20' },
};

export function JobCard({ job }: { job: FeedJob }) {
  const router = useRouter();

  const myActiveJobId = useBoard((s) => s.myActiveJobId);
  const myNegotiationId = useBoard((s) => s.myNegotiationId);
  const showToast = useBoard((s) => s.showToast);
  const watchedJobIds = useBoard((s) => s.watchedJobIds);
  const toggleWatch = useBoard((s) => s.toggleWatch);

  const isMyNegotiation = (job.status === 'NEGOTIATING' || job.status === 'IN_PROGRESS') && job.freelancerId && job.id === myActiveJobId;
  const occupiedBySomeone = job.status === 'NEGOTIATING' && !isMyNegotiation;
  const inProgress = job.status === 'IN_PROGRESS';
  const completed = job.status === 'COMPLETED';
  const blockedByMyOtherNegotiation = !!myActiveJobId && myActiveJobId !== job.id;
  const clickable = ((job.status === 'OPEN' && !blockedByMyOtherNegotiation) || isMyNegotiation);
  const isWatched = watchedJobIds.includes(job.id);

  const statusConfig = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.OPEN;

  async function handleOpen() {
    if (!clickable) return;
    if (isMyNegotiation && myNegotiationId) {
      router.push('/negotiation');
      return;
    }
    if (job.status === 'OPEN') {
      router.push(`/jobs/${job.id}`);
      return;
    }
  }

  function handleWatch(e: React.MouseEvent) {
    e.stopPropagation();
    toggleWatch(job.id);
    showToast(isWatched ? 'Removed from watchlist' : 'We will notify you when this opens up');
  }

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-surface transition-all duration-200 ${
        clickable
          ? 'cursor-pointer border-border-subtle shadow-soft hover:shadow-medium hover:border-accent-200 dark:hover:border-accent-500/30'
          : isMyNegotiation
          ? 'cursor-pointer border-success-500/40 shadow-medium ring-2 ring-success-500/20'
          : 'border-border-subtle opacity-60'
      }`}
      onClick={clickable ? handleOpen : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } } : undefined}
      aria-label={isMyNegotiation ? `Resume negotiation for ${job.title}` : occupiedBySomeone ? `${job.title} — occupied` : completed ? `${job.title} — completed` : `Lock ${job.title}`}
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-txt-primary leading-snug line-clamp-2">{job.title}</h3>
          <div className="flex items-center gap-1.5 shrink-0">
            {occupiedBySomeone && (
              <button
                onClick={handleWatch}
                className="rounded-md p-1 text-txt-tertiary transition-colors hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-50/20"
                aria-label={isWatched ? 'Remove from watchlist' : 'Notify me when available'}
              >
                <BellIcon className="h-4 w-4" filled={isWatched} />
              </button>
            )}
            <span className="rounded-md bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">
              {formatBudget(job.budgetCents, job.currency)}
            </span>
          </div>
        </div>
        <p className="mb-3 text-xs text-txt-secondary line-clamp-2 leading-relaxed">{job.description}</p>
        <div className="mt-auto flex items-center gap-3 text-xs text-txt-tertiary">
          <span className="flex items-center gap-1">
            <ClockIcon className="h-3 w-3" />
            {timeAgo(job.createdAt)}
          </span>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig.badge}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {occupiedBySomeone && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-txt-primary/5 backdrop-blur-[1px]">
          <div className="flex items-center gap-2 rounded-lg bg-surface/90 px-3 py-2 text-sm font-medium text-txt-secondary shadow-medium">
            <LockIcon className="h-4 w-4" />
            Occupied — in negotiation
          </div>
        </div>
      )}

      {isMyNegotiation && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-success-500/5">
          <div className="flex items-center gap-2 rounded-lg bg-surface/90 px-3 py-2 text-sm font-medium text-success-600 shadow-medium">
            <span className="h-2 w-2 rounded-full bg-success-500 animate-pulse" />
            Your negotiation — tap to resume
          </div>
        </div>
      )}

      {inProgress && !isMyNegotiation && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-txt-primary/5">
          <div className="rounded-lg bg-surface/90 px-3 py-2 text-sm font-medium text-accent-600 shadow-medium">
            In Progress
          </div>
        </div>
      )}

      {completed && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-txt-primary/5">
          <div className="rounded-lg bg-surface/90 px-3 py-2 text-sm font-medium text-txt-tertiary shadow-medium">
            Completed
          </div>
        </div>
      )}

      {blockedByMyOtherNegotiation && job.status === 'OPEN' && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-canvas/80 backdrop-blur-[1px]">
          <div className="rounded-lg bg-surface/90 px-3 py-2 text-sm font-medium text-txt-tertiary shadow-medium text-center">
            Finish your current<br />negotiation first
          </div>
        </div>
      )}
    </div>
  );
}
