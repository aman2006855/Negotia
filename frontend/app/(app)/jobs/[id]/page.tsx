'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { ArrowLeftIcon, ClockIcon, DollarIcon, StarIcon, CheckIcon } from '@/components/icons';
import type { FeedJob } from '@/lib/types';

type JobDetail = FeedJob & {
  clientAvatar?: string;
  clientRating?: number;
  clientReviewCount?: number;
  clientCreatedAt?: string;
  clientEntityType?: string;
  clientCompanyName?: string;
  agreementText?: string;
};

function formatBudget(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const acquireLock = useBoard((s) => s.acquireLock);
  const myActiveJobId = useBoard((s) => s.myActiveJobId);
  const myNegotiationId = useBoard((s) => s.myNegotiationId);
  const showToast = useBoard((s) => s.showToast);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          const me = await api.me();
          if (me.user) setUser(me.user);
        }
        const data = await api.getJobById(jobId);
        setJob(data as JobDetail);
      } catch {
        setError('Job not found');
      }
      setLoading(false);
    })();
  }, [jobId, user, setUser]);

  async function handleLockJob() {
    if (!job || locking) return;
    setLocking(true);
    setError('');
    try {
      const res = await getSocket().timeout(10000).emitWithAck('job:lock', { jobId: job.id });
      if (res && res.ok) {
        acquireLock(res.job.id, res.negotiation.id);
        router.push('/negotiation');
      } else {
        const err = res?.error;
        if (err === 'JOB_TAKEN' || err === 'NOT_OPEN') {
          showToast('Someone just took this job');
          router.push('/jobs');
        } else if (err === 'ALREADY_NEGOTIATING' && myNegotiationId) {
          router.push('/negotiation');
        } else {
          setError('Could not lock this job. It may have been taken already.');
        }
      }
    } catch {
      setError('Connection lost — please try again');
    } finally {
      setLocking(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (error && !job) {
    return (
      <div className="pb-24 max-w-lg mx-auto px-4 py-6">
        <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
          <p className="text-sm text-danger-600 mb-3">{error}</p>
          <button onClick={() => router.back()} className="btn-primary">Go back</button>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const isMyNegotiation = (job.status === 'NEGOTIATING' || job.status === 'IN_PROGRESS') && job.freelancerId && job.id === myActiveJobId;
  const isOpen = job.status === 'OPEN';
  const isFreelancer = user?.role === 'FREELANCER';
  const canApply = isOpen && isFreelancer && !myActiveJobId;
  const hasExistingNegotiation = isMyNegotiation && myNegotiationId;

  const clientInitials = (job.clientName || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="pb-24 max-w-lg mx-auto px-4 py-6">
      {/* Back */}
      <button onClick={() => router.back()}
        className="flex items-center gap-1.5 text-sm text-txt-secondary hover:text-txt-primary transition-colors mb-6 -ml-1">
        <ArrowLeftIcon className="h-4 w-4" /> Back to jobs
      </button>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
          isOpen ? 'bg-success-50 text-success-600 dark:bg-success-50/20 dark:text-success-500' :
          isMyNegotiation ? 'bg-success-50 text-success-600 dark:bg-success-50/20 dark:text-success-500' :
          'bg-warning-50 text-warning-600 dark:bg-warning-50/20 dark:text-warning-500'
        }`}>
          {isMyNegotiation ? 'Your Negotiation' : isOpen ? 'Open for Applications' : job.status.replace('_', ' ')}
        </span>
      </div>

      {/* Title + Budget */}
      <h1 className="text-xl sm:text-2xl font-bold text-txt-primary leading-tight mb-3">{job.title}</h1>
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-1.5 text-accent-600">
          <DollarIcon className="h-5 w-5" />
          <span className="text-lg font-bold">{formatBudget(job.budgetCents)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-txt-tertiary">
          <ClockIcon className="h-4 w-4" />
          <span className="text-sm">{timeAgo(job.createdAt)}</span>
        </div>
        {job.category && job.category !== 'All' && (
          <span className="rounded-full bg-inset px-2.5 py-1 text-xs font-medium text-txt-secondary">{job.category}</span>
        )}
      </div>

      {/* Description */}
      <div className="card p-5 mb-5">
        <h2 className="text-sm font-semibold text-txt-primary mb-2">Description</h2>
        <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line">{job.description}</p>
      </div>

      {/* Agreement Preview */}
      {job.agreementText && (
        <div className="card p-5 mb-5 border-accent-200/50 dark:border-accent-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-50 dark:bg-accent-50/20">
              <CheckIcon className="h-4 w-4 text-accent-600" />
            </div>
            <h2 className="text-sm font-semibold text-txt-primary">Agreement Terms</h2>
          </div>
          <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-line bg-inset/50 rounded-xl p-4">{job.agreementText}</p>
          <p className="mt-3 text-xs text-txt-tertiary">You must sign this agreement to start the project.</p>
        </div>
      )}

      {/* Client Card */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-txt-primary mb-3">Posted by</h2>
        <button
          onClick={() => router.push(`/client/${job.clientId}`)}
          className="w-full flex items-center gap-3.5 p-3 rounded-xl border border-border-subtle hover:border-accent-200 dark:hover:border-accent-500/30 hover:bg-accent-50/50 dark:hover:bg-accent-50/10 transition-all text-left group"
        >
          {job.clientAvatar ? (
            <img src={job.clientAvatar} alt={job.clientName}
              className="h-12 w-12 rounded-full object-cover border-2 border-surface shadow-sm" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent-50 dark:bg-accent-50/20 text-lg font-bold text-accent-700 dark:text-accent-400">
              {clientInitials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-txt-primary group-hover:text-accent-600 transition-colors truncate">{job.clientName}</span>
              <span className="shrink-0 rounded-full bg-accent-50 dark:bg-accent-50/20 px-2 py-0.5 text-[10px] font-bold text-accent-600 dark:text-accent-400">CLIENT</span>
            </div>
            {(job.clientRating ?? 0) > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <StarIcon className="h-3 w-3 text-warning-500" filled />
                <span className="text-xs font-medium text-txt-primary">{job.clientRating?.toFixed(1)}</span>
                <span className="text-xs text-txt-tertiary">({job.clientReviewCount} reviews)</span>
              </div>
            )}
            {job.clientEntityType && (
              <p className="text-xs text-txt-tertiary mt-0.5">
                {job.clientEntityType === 'COMPANY' ? job.clientCompanyName || 'Company' : 'Individual'}
              </p>
            )}
          </div>
          <svg className="h-4 w-4 text-txt-tertiary group-hover:text-accent-600 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl bg-danger-50 border border-danger-500/20 px-4 py-3 text-sm text-danger-600">
          {error}
        </div>
      )}

      {/* CTA Button */}
      {isFreelancer && (
        <div className="sticky bottom-20 bg-canvas/95 backdrop-blur-sm pt-3 pb-2">
          {hasExistingNegotiation ? (
            <button
              onClick={() => router.push('/negotiation')}
              className="w-full rounded-xl bg-success-600 py-3.5 text-sm font-semibold text-white shadow-medium hover:bg-success-700 transition-colors"
            >
              Resume Negotiation
            </button>
          ) : canApply ? (
            <button
              onClick={handleLockJob}
              disabled={locking}
              className="w-full rounded-xl bg-accent-600 py-3.5 text-sm font-semibold text-white shadow-medium hover:bg-accent-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {locking ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Locking job…
                </span>
              ) : (
                'Start Negotiation / Apply'
              )}
            </button>
          ) : !isFreelancer ? (
            <div className="text-center text-sm text-txt-tertiary py-3">
              Only freelancers can apply to jobs
            </div>
          ) : myActiveJobId ? (
            <div className="text-center text-sm text-txt-tertiary py-3">
              Finish your current negotiation first
            </div>
          ) : (
            <div className="text-center text-sm text-txt-tertiary py-3">
              This job is no longer available
            </div>
          )}
        </div>
      )}

      {!isFreelancer && (
        <div className="sticky bottom-20 bg-canvas/95 backdrop-blur-sm pt-3 pb-2 text-center text-sm text-txt-tertiary">
          This is your job posting
        </div>
      )}
    </div>
  );
}
