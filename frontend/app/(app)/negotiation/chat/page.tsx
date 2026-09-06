'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { ChatRoom } from '@/components/ChatRoom';
import type { NegotiationState } from '@/lib/types';

export default function NegotiationChatPage() {
  const router = useRouter();
  const myNegotiationId = useBoard((s) => s.myNegotiationId);
  const acquireLock = useBoard((s) => s.acquireLock);
  const setNegotiation = useBoard((s) => s.setNegotiation);
  const [state, setState] = useState<NegotiationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await api.joinNegotiation(myNegotiationId ?? undefined);
        setState(s);
        setNegotiation(s);
        acquireLock(s.job.id, s.negotiationId);
      } catch {
        setError('No active negotiation found');
      }
    })();
  }, [myNegotiationId, setNegotiation, acquireLock]);

  if (error) {
    return (
      <div className="page-container flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-sm text-danger-600 mb-3">{error}</p>
        <button onClick={() => router.push('/negotiation')} className="btn-primary">
          Back to negotiations
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="page-container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  return <ChatRoom state={state} />;
}
