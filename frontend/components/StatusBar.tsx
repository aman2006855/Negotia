'use client';

import Link from 'next/link';
import { useBoard } from '@/lib/store';

export function StatusBar() {
  const myActiveJobId = useBoard((s) => s.myActiveJobId);
  const myNegotiationId = useBoard((s) => s.myNegotiationId);
  const jobs = useBoard((s) => s.jobs);

  if (!myActiveJobId) return null;

  const job = jobs.find((j) => j.id === myActiveJobId);

  return (
    <div className="sticky top-14 z-40 border-b border-success-500/20 bg-success-50 px-4 py-2">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-success-600">
          <span className="inline-block h-2 w-2 rounded-full bg-success-500 animate-pulse" />
          Status: 1 Project in Negotiation Stage
          {job && <span className="text-txt-secondary font-normal">— {job.title}</span>}
        </div>
        {myNegotiationId && (
          <Link
            href={`/negotiate/${myNegotiationId}`}
            className="rounded-md bg-success-600 px-3 py-1 text-xs font-medium text-white transition hover:bg-success-600/90"
          >
            Return to negotiation
          </Link>
        )}
      </div>
    </div>
  );
}
