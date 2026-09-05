'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { ChatRoom } from '@/components/ChatRoom';
import type { NegotiationState } from '@/lib/types';

export default function NegotiationChatPage() {
  const router = useRouter();
  const myActiveJobId = useBoard((s) => s.myActiveJobId);
  const myNegotiationId = useBoard((s) => s.myNegotiationId);
  const setNegotiation = useBoard((s) => s.setNegotiation);
  const [state, setState] = useState<NegotiationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!myActiveJobId) {
      router.replace('/negotiation');
      return;
    }
    (async () => {
      try {
        const s = await api.joinNegotiation();
        setState(s);
        setNegotiation(s);
      } catch {
        setError('Could not load negotiation');
      }
    })();
  }, [myActiveJobId, setNegotiation, router]);

  if (error) {
    return (
      <div className="page-container flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-sm text-danger-600 mb-3">{error}</p>
        <button onClick={() => router.push('/jobs')} className="btn-primary">
          Back to board
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
