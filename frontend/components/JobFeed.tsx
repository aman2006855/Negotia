'use client';

import { useBoard } from '@/lib/store';
import { JobCard } from './JobCard';

export function JobFeed() {
  const jobs = useBoard((s) => s.jobs);
  const jobsLoaded = useBoard((s) => s.jobsLoaded);

  if (!jobsLoaded) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl border border-border-subtle bg-surface" />
        ))}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong py-16 text-center">
        <div className="mb-3 text-txt-tertiary">
          <svg className="mx-auto h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
        </div>
        <p className="text-sm font-medium text-txt-secondary">No jobs available</p>
        <p className="mt-1 text-xs text-txt-tertiary">Check back later — new jobs appear in real time</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </div>
  );
}
