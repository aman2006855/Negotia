'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { getSocket } from '@/lib/socket';
import { Header } from '@/components/Header';
import { StatusBar } from '@/components/StatusBar';
import { JobFeed } from '@/components/JobFeed';
import { Toast } from '@/components/Toast';
import { useRealtime } from '@/lib/useRealtime';
import type { Me } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const setJobs = useBoard((s) => s.setJobs);
  const acquireLock = useBoard((s) => s.acquireLock);
  const [loading, setLoading] = useState(true);

  useRealtime();

  useEffect(() => {
    (async () => {
      try {
        const me: Me = await api.me();
        setUser(me.user);
        if (me.activeJob) acquireLock(me.activeJob.jobId, me.activeJob.negotiationId);

        const socket = getSocket() as any;
        if (socket.on) {
          socket.on('negotiation:started', (state: { negotiationId: string }) => {
            acquireLock(state.negotiationId, state.negotiationId);
            router.push(`/negotiate/${state.negotiationId}`);
          });
        }

        if (me.user.role === 'FREELANCER') {
          const { jobs } = await api.feed();
          setJobs(jobs);
        } else {
          const { jobs } = await api.myJobs();
          setJobs(jobs.map((j: any) => ({
            id: j.id, title: j.title, description: j.description,
            budgetCents: j.budgetCents, status: j.status,
            lockedAt: j.lockedAt, createdAt: j.createdAt,
            clientId: j.clientId, clientName: j.clientName,
            freelancerId: j.freelancerId, freelancerName: j.freelancerName,
          })));
        }
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <Header />
      <StatusBar />
      <main className="page-container">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-txt-primary tracking-tight">
            {user.role === 'FREELANCER' ? 'Available Jobs' : 'Your Jobs'}
          </h1>
          <p className="mt-1 text-sm text-txt-secondary">
            {user.role === 'FREELANCER'
              ? 'Click a job to lock it and start a 1-on-1 negotiation'
              : 'Jobs you have posted — wait for a freelancer to lock one'}
          </p>
        </div>
        <JobFeed />
      </main>
      <Toast />
    </>
  );
}
