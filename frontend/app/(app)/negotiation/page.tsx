'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { MessageIcon } from '@/components/icons';
import type { NegotiationState } from '@/lib/types';

export default function NegotiationPage() {
  const router = useRouter();
  const acquireLock = useBoard((s) => s.acquireLock);
  const setNegotiation = useBoard((s) => s.setNegotiation);
  const [checking, setChecking] = useState(true);
  const [hasActive, setHasActive] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.joinNegotiation();
        acquireLock(s.job.id, s.negotiationId);
        setNegotiation(s);
        setHasActive(true);
        router.replace('/negotiation/chat');
      } catch {
        setHasActive(false);
      }
      setChecking(false);
    })();
  }, [acquireLock, setNegotiation, router]);

  if (checking || hasActive) {
    return (
      <div className="page-container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full bg-inset p-4">
        <MessageIcon className="h-8 w-8 text-txt-tertiary" />
      </div>
      <h2 className="text-base font-semibold text-txt-primary">No active negotiations</h2>
      <p className="mt-1 max-w-xs text-sm text-txt-secondary">
        You are all caught up. Lock a job to start a 1-on-1 negotiation with a client.
      </p>
      <button
        onClick={() => router.push('/jobs')}
        className="mt-6 btn-primary"
      >
        Browse Jobs
      </button>
    </div>
  );
}
