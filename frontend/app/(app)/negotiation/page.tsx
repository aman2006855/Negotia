'use client';

import { useRouter } from 'next/navigation';
import { useBoard } from '@/lib/store';
import { MessageIcon } from '@/components/icons';

export default function NegotiationPage() {
  const router = useRouter();
  const negotiation = useBoard((s) => s.negotiation);
  const myActiveJobId = useBoard((s) => s.myActiveJobId);
  const jobs = useBoard((s) => s.jobs);

  if (negotiation && !negotiation.outcome) {
    router.replace('/negotiation/chat');
    return null;
  }

  if (myActiveJobId) {
    router.replace('/negotiation/chat');
    return null;
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
