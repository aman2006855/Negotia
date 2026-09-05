'use client';

import Link from 'next/link';
import { useBoard } from '@/lib/store';

export function TopBanner() {
  const myActiveJobId = useBoard((s) => s.myActiveJobId);
  const myNegotiationId = useBoard((s) => s.myNegotiationId);
  const jobs = useBoard((s) => s.jobs);

  if (!myActiveJobId) return null;

  const job = jobs.find((j) => j.id === myActiveJobId);

  return (
    <div className="sticky top-0 z-40 border-b border-success-500/20 bg-success-50 dark:bg-success-50/20 px-4 py-2">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-success-600">
          <span className="inline-block h-2 w-2 rounded-full bg-success-500 animate-pulse" />
          1 Project in Negotiation
          {job && <span className="text-txt-secondary font-normal hidden sm:inline">— {job.title}</span>}
        </div>
        {myNegotiationId && (
          <Link
            href="/negotiation"
            className="rounded-md bg-success-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-success-600/90"
          >
            Return
          </Link>
        )}
      </div>
    </div>
  );
}
