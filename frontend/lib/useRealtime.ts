'use client';

import { useEffect } from 'react';
import { getSocket } from './socket';
import { useBoard } from './store';
import type { FeedJob } from './types';

export function useRealtime() {
  const upsertJob = useBoard((s) => s.upsertJob);
  const releaseLock = useBoard((s) => s.releaseLock);
  const showToast = useBoard((s) => s.showToast);

  useEffect(() => {
    const socket = getSocket() as any;
    if (!socket.on) return; // mock mode

    const onJobUpdated = (job: FeedJob) => upsertJob(job);
    const onLockReleased = (p: { reason: string }) => {
      releaseLock();
      showToast(p.reason === 'expired' ? 'Negotiation timed out — job available again.' : 'Negotiation ended — you are free to browse.');
    };
    socket.on('job:updated', onJobUpdated);
    socket.on('lock:released', onLockReleased);
    return () => {
      socket.off('job:updated', onJobUpdated);
      socket.off('lock:released', onLockReleased);
    };
  }, [upsertJob, releaseLock, showToast]);
}
