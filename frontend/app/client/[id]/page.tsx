'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { ArrowLeftIcon, StarIcon, BriefcaseIcon, DollarIcon, ClockIcon, ExternalLinkIcon, CheckIcon } from '@/components/icons';
import { formatBudget } from '@/lib/constants';
import type { FeedJob, Review, User } from '@/lib/types';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'today';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [data, setData] = useState<{ user: User; openJobs: FeedJob[]; completedJobs: any[]; reviews: Review[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const result = await api.getPublicClientProfile(id);
        setData(result);
      } catch {
        setError('Client not found');
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-container flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-sm text-danger-600 mb-3">{error || 'Not found'}</p>
        <button onClick={() => router.back()} className="btn-primary">Go back</button>
      </div>
    );
  }

  const { user, openJobs, completedJobs, reviews } = data;
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  const totalSpent = user.totalEarningsCents;

  return (
    <div className="page-container pb-24">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="rounded-lg p-1.5 text-txt-tertiary hover:bg-inset hover:text-txt-primary transition-colors">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-txt-primary">Client Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="card p-5 mb-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-50 text-lg font-bold text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-txt-primary">{user.name}</h2>
            <p className="text-xs text-txt-secondary">Member since {memberSince}</p>
            {user.rating > 0 && (
              <div className="mt-1 flex items-center gap-1">
                <StarIcon className="h-3.5 w-3.5 text-warning-500" filled />
                <span className="text-sm font-medium text-txt-primary">{user.rating.toFixed(1)}</span>
                <span className="text-xs text-txt-tertiary">({user.reviewCount} reviews)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="stat-card items-center text-center">
          <DollarIcon className="h-4 w-4 text-success-500 mb-1" />
          <p className="text-lg font-semibold text-txt-primary">{formatBudget(totalSpent)}</p>
          <p className="text-[10px] text-txt-tertiary">Total Spent</p>
        </div>
        <div className="stat-card items-center text-center">
          <CheckIcon className="h-4 w-4 text-accent-500 mb-1" />
          <p className="text-lg font-semibold text-txt-primary">{completedJobs.length}</p>
          <p className="text-[10px] text-txt-tertiary">Completed</p>
        </div>
        <div className="stat-card items-center text-center">
          <BriefcaseIcon className="h-4 w-4 text-warning-500 mb-1" />
          <p className="text-lg font-semibold text-txt-primary">{openJobs.length}</p>
          <p className="text-[10px] text-txt-tertiary">Open Posts</p>
        </div>
      </div>

      {/* Open Job Posts */}
      <div className="mb-6">
        <h3 className="section-title mb-3 text-sm">Open Job Posts</h3>
        {openJobs.length === 0 ? (
          <p className="text-sm text-txt-tertiary text-center py-6">No open job posts</p>
        ) : (
          <div className="space-y-2">
            {openJobs.map((job) => (
              <div key={job.id} className="card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-txt-primary line-clamp-1">{job.title}</h4>
                    <p className="text-xs text-txt-secondary line-clamp-1 mt-0.5">{job.description}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-accent-50 px-2 py-0.5 text-xs font-semibold text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">
                    {formatBudget(job.budgetCents, job.currency)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-[10px] text-txt-tertiary">
                  <ClockIcon className="h-3 w-3" />
                  <span>{timeAgo(job.createdAt)}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                    job.status === 'OPEN' ? 'bg-success-50 text-success-600 dark:bg-success-50/20' : 'bg-warning-50 text-warning-600 dark:bg-warning-50/20'
                  }`}>
                    {job.status === 'OPEN' ? 'Open' : 'Negotiating'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Projects */}
      <div className="mb-6">
        <h3 className="section-title mb-3 text-sm">Completed Projects</h3>
        {completedJobs.length === 0 ? (
          <p className="text-sm text-txt-tertiary text-center py-6">No completed projects yet</p>
        ) : (
          <div className="space-y-2">
            {completedJobs.map((job: any) => (
              <div key={job.id} className="card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-medium text-txt-primary line-clamp-1">{job.title}</h4>
                    <p className="text-xs text-txt-secondary mt-0.5">with {job.freelancerName}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-inset px-2 py-0.5 text-xs font-medium text-txt-tertiary">
                    {formatBudget(job.budgetCents, job.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div>
        <h3 className="section-title mb-3 text-sm">Reviews from Freelancers</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-txt-tertiary text-center py-6">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="card p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon key={star} className="h-3 w-3 text-warning-500" filled={star <= review.rating} />
                    ))}
                  </div>
                  <span className="text-[10px] text-txt-tertiary">{timeAgo(review.createdAt)}</span>
                </div>
                <p className="text-sm text-txt-primary mb-1">{review.comment}</p>
                <p className="text-[10px] text-txt-tertiary">by {review.freelancerName}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
