'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/Header';
import { ChatRoom } from '@/components/ChatRoom';
import { Toast } from '@/components/Toast';
import type { NegotiationState } from '@/lib/types';

export default function NegotiatePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [state, setState] = useState<NegotiationState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await (api as any).joinNegotiation();
        setState(s);
      } catch {
        setError('Could not load negotiation');
      }
    })();
  }, [id]);

  if (error) {
    return (
      <>
        <Header />
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
          <p className="text-sm text-danger-600 mb-3">{error}</p>
          <button onClick={() => router.push('/')} className="rounded-lg bg-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-accent-700">
            Back to board
          </button>
        </div>
        <Toast />
      </>
    );
  }

  if (!state) {
    return (
      <>
        <Header />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <ChatRoom state={state} />
      <Toast />
    </>
  );
}
