'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import type { FeedJob } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-success-50 text-success-700 border-success-500/20',
  NEGOTIATING: 'bg-warning-50 text-warning-700 border-warning-500/20',
  IN_PROGRESS: 'bg-accent-50 text-accent-700 border-accent-500/20',
  COMPLETED: 'bg-inset text-txt-tertiary border-border-subtle',
  CANCELLED: 'bg-danger-50 text-danger-600 border-danger-500/20',
};

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function MyPostingsPage() {
  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const router = useRouter();
  const [jobs, setJobs] = useState<FeedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          const me = await api.me();
          if (me.user) setUser(me.user);
        }
        const myJobs = await api.myJobs();
        setJobs(myJobs);
      } catch {}
      setLoading(false);
    })();
  }, [user, setUser]);

  const firstName = (user?.fullName || user?.name || '').split(' ')[0] || 'there';

  return (
    <div className="page-container">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-txt-primary tracking-tight">
            Hey, {firstName} 👋
          </h1>
          <p className="text-sm text-txt-secondary mt-1">Manage your posted jobs.</p>
        </div>
        <button
          onClick={() => router.push('/post')}
          className="flex items-center gap-1.5 rounded-xl bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-700 transition-colors shadow-soft"
        >
          + New Job
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-inset mb-4">
            <svg className="h-8 w-8 text-txt-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-txt-primary mb-1">No jobs posted yet</p>
          <p className="text-xs text-txt-tertiary max-w-[240px] mb-4">Post your first job and find talented freelancers.</p>
          <button
            onClick={() => router.push('/post')}
            className="rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-700 transition-colors"
          >
            Post a Job
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              onClick={() => router.push('/workspace')}
              className="card p-4 cursor-pointer hover:border-accent-500/30 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-txt-primary truncate">{job.title}</h3>
                  <p className="text-xs text-txt-secondary mt-1 line-clamp-2">{job.description}</p>
                </div>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[job.status] || ''}`}>
                  {job.status.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
                <span className="text-sm font-bold text-accent-600">{formatCents(job.budgetCents)}</span>
                <span className="text-[11px] text-txt-tertiary">{timeAgo(job.createdAt)}</span>
              </div>
              {job.status === 'OPEN' && (
                <p className="text-[11px] text-success-600 font-medium mt-2">Waiting for freelancers...</p>
              )}
              {job.status === 'NEGOTIATING' && (
                <p className="text-[11px] text-warning-600 font-medium mt-2">Negotiation in progress</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
