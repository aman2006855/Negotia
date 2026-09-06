'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { MessageIcon } from '@/components/icons';
import { formatBudget } from '@/lib/constants';

interface ClientNegotiation {
  id: string;
  jobId: string;
  jobTitle: string;
  budgetCents: number;
  currency: string;
  jobStatus: string;
  outcome: string | null;
  closedAt: string | null;
  createdAt: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string | null;
  lastMessage: { body: string; createdAt: string; senderId: string } | null;
}

const OUTCOME_BADGE: Record<string, string> = {
  ACCEPTED: 'bg-success-50 text-success-600 border-success-500/20',
  DECLINED: 'bg-danger-50 text-danger-600 border-danger-500/20',
  EXPIRED: 'bg-inset text-txt-tertiary border-border-subtle',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function NegotiationPage() {
  const router = useRouter();
  const user = useBoard((s) => s.user);
  const acquireLock = useBoard((s) => s.acquireLock);
  const setNegotiation = useBoard((s) => s.setNegotiation);
  const [checking, setChecking] = useState(true);
  const [clientNegs, setClientNegs] = useState<ClientNegotiation[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const isClient = user?.role === 'CLIENT';

  useEffect(() => {
    if (!user) return;

    if (!isClient) {
      (async () => {
        try {
          const s = await api.joinNegotiation();
          acquireLock(s.job.id, s.negotiationId);
          setNegotiation(s);
          router.replace('/negotiation/chat');
          return;
        } catch {}
        setChecking(false);
      })();
    } else {
      (async () => {
        try {
          const negs = await api.getClientNegotiations();
          setClientNegs(negs);
        } catch {}
        setLoadingList(false);
        setChecking(false);
      })();
    }
  }, [user, isClient, acquireLock, setNegotiation, router]);

  if (checking) {
    return (
      <div className="page-container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 rounded-full bg-inset p-4">
          <MessageIcon className="h-8 w-8 text-txt-tertiary" />
        </div>
        <h2 className="text-base font-semibold text-txt-primary">No active negotiations</h2>
        <p className="mt-1 max-w-xs text-sm text-txt-secondary">
          You are all caught up. Lock a job to start a 1-on-1 negotiation with a client.
        </p>
        <button onClick={() => router.push('/jobs')} className="mt-6 btn-primary">
          Browse Jobs
        </button>
      </div>
    );
  }

  const active = clientNegs.filter((n) => !n.outcome);
  const closed = clientNegs.filter((n) => !!n.outcome);

  return (
    <div className="page-container">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-txt-primary tracking-tight">Negotiations</h1>
        <p className="text-sm text-txt-secondary mt-1">Manage all your project negotiations</p>
      </div>

      {loadingList ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
        </div>
      ) : clientNegs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-inset mb-4">
            <MessageIcon className="h-8 w-8 text-txt-tertiary" />
          </div>
          <p className="text-sm font-semibold text-txt-primary mb-1">No negotiations yet</p>
          <p className="text-xs text-txt-tertiary max-w-[240px] mb-4">When a freelancer locks your job, the negotiation will appear here.</p>
          <button onClick={() => router.push('/my-postings')} className="rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-700 transition-colors">
            View My Posts
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {active.length > 0 && (
            <>
              <p className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider">Active</p>
              {active.map((neg) => (
                <button
                  key={neg.id}
                  onClick={() => {
                    acquireLock(neg.jobId, neg.id);
                    router.push('/negotiation/chat');
                  }}
                  className="w-full text-left card p-4 hover:border-accent-500/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {neg.freelancerAvatar ? (
                      <img src={neg.freelancerAvatar} alt={neg.freelancerName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-50 text-sm font-bold text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">
                        {neg.freelancerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-txt-primary truncate">{neg.jobTitle}</h3>
                        <span className="shrink-0 rounded-full bg-success-50 border border-success-500/20 px-2 py-0.5 text-[10px] font-semibold text-success-600">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-txt-secondary mt-0.5">with {neg.freelancerName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-accent-600">{formatBudget(neg.budgetCents, neg.currency)}</span>
                        {neg.lastMessage && (
                          <span className="text-[10px] text-txt-tertiary">{timeAgo(neg.lastMessage.createdAt)}</span>
                        )}
                      </div>
                      {neg.lastMessage && (
                        <p className="text-xs text-txt-tertiary mt-1 truncate">{neg.lastMessage.body}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {closed.length > 0 && (
            <>
              <p className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider mt-4">Closed</p>
              {closed.map((neg) => (
                <div key={neg.id} className="card p-4 opacity-70">
                  <div className="flex items-start gap-3">
                    {neg.freelancerAvatar ? (
                      <img src={neg.freelancerAvatar} alt={neg.freelancerName} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-inset text-sm font-bold text-txt-tertiary">
                        {neg.freelancerName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-txt-primary truncate">{neg.jobTitle}</h3>
                        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${OUTCOME_BADGE[neg.outcome!] || ''}`}>
                          {neg.outcome}
                        </span>
                      </div>
                      <p className="text-xs text-txt-secondary mt-0.5">with {neg.freelancerName}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs font-bold text-accent-600">{formatBudget(neg.budgetCents, neg.currency)}</span>
                        <span className="text-[10px] text-txt-tertiary">{timeAgo(neg.closedAt || neg.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
