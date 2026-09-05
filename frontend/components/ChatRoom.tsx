'use client';

import { useState, useRef, useEffect } from 'react';
import { getSocket } from '@/lib/socket';
import { useBoard } from '@/lib/store';
import type { ChatMessage, NegotiationState } from '@/lib/types';
import { SendIcon, CheckIcon, XIcon } from './icons';
import { AgreementModal } from './AgreementModal';

const QUICK_REPLIES = [
  'Can you share the Figma file?',
  'Is the budget negotiable?',
  "What's your timeline?",
  'Can we start this week?',
];

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function ChatRoom({ state: initialState }: { state: NegotiationState }) {
  const [state, setState] = useState(initialState);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);
  const [closedOutcome, setClosedOutcome] = useState<string | null>(null);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const user = useBoard((s) => s.user);

  const myUserId = user?.id;
  const isFreelancer = state.myRole === 'FREELANCER' && !state.outcome;

  useEffect(() => {
    const socket = getSocket();
    const onMessage = (msg: ChatMessage) => {
      setState((prev) => ({ ...prev, messages: [...prev.messages, msg] }));
    };
    const onClosed = (p: { outcome: string }) => {
      setClosedOutcome(p.outcome);
      setState((prev) => ({ ...prev, outcome: p.outcome as NegotiationState['outcome'] }));
    };
    socket.on('negotiation:message', onMessage);
    socket.on('negotiation:closed', onClosed);
    return () => {
      socket.off('negotiation:message', onMessage);
      socket.off('negotiation:closed', onClosed);
    };
  }, []);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.messages]);

  useEffect(() => {
    const socket = getSocket();
    const hb = setInterval(() => socket.emit('presence:heartbeat'), 60_000);
    return () => clearInterval(hb);
  }, []);

  async function handleSend() {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await getSocket().timeout(5000).emitWithAck('negotiation:message', {
        negotiationId: state.negotiationId,
        body: input.trim(),
      });
      if (res?.ok) {
        setState((prev) => ({ ...prev, messages: [...prev.messages, res.message] }));
        setInput('');
      }
    } finally {
      setSending(false);
    }
  }

  async function handleDecline() {
    if (!confirm('Decline this negotiation? The job will return to the feed.')) return;
    const res = await getSocket().timeout(5000).emitWithAck('negotiation:decline', { negotiationId: state.negotiationId });
    if (res?.ok || res?.error === 'ALREADY_CLOSED') {
      setClosedOutcome('DECLINED');
      setState((prev) => ({ ...prev, outcome: 'DECLINED' }));
    }
  }

  async function handleSign() {
    const res = await getSocket().timeout(5000).emitWithAck('agreement:sign', { negotiationId: state.negotiationId });
    if (res?.ok || res?.error === 'ALREADY_CLOSED') {
      setShowAgreement(false);
      setClosedOutcome('ACCEPTED');
      setState((prev) => ({ ...prev, outcome: 'ACCEPTED' }));
    }
  }

  return (
    <>
      <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
        <div className="shrink-0 border-b border-border-subtle bg-surface px-4 py-3">
          <div className="mx-auto flex max-w-2xl items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-txt-primary">{state.job.title}</h2>
              <p className="text-xs text-txt-secondary">
                {state.myRole === 'CLIENT' ? 'Negotiating with freelancer' : `Negotiating with ${state.job.clientName}`}
                {' · '}
                <span className="font-medium text-accent-600">
                  {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(state.job.budgetCents / 100)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {state.outcome && (
          <div className={`shrink-0 border-b px-4 py-3 text-center text-sm font-medium ${
            state.outcome === 'ACCEPTED' ? 'border-success-500/20 bg-success-50 text-success-600 dark:bg-success-50/20' :
            state.outcome === 'DECLINED' ? 'border-danger-500/20 bg-danger-50 text-danger-600 dark:bg-danger-50/20' :
            'border-warning-500/20 bg-warning-50 text-warning-600 dark:bg-warning-50/20'
          }`}>
            {state.outcome === 'ACCEPTED' && 'Agreement signed — deal confirmed'}
            {state.outcome === 'DECLINED' && 'Negotiation declined — job returned to feed'}
            {state.outcome === 'EXPIRED' && 'Negotiation expired — job returned to feed'}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-2xl space-y-3">
            {state.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-2 rounded-full bg-accent-50 p-3 dark:bg-accent-50/20">
                  <SendIcon className="h-5 w-5 text-accent-500" />
                </div>
                <p className="text-sm font-medium text-txt-secondary">Start the conversation</p>
                <p className="mt-1 text-xs text-txt-tertiary">Messages are visible to both participants</p>
              </div>
            )}
            {state.messages.map((msg) => {
              const mine = msg.senderId === myUserId;
              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${
                    mine
                      ? 'bg-accent-600 text-white rounded-br-sm'
                      : 'bg-inset text-txt-primary rounded-bl-sm'
                  }`}>
                    {!mine && <p className="mb-0.5 text-xs font-medium text-accent-600">{msg.senderName}</p>}
                    <p className="text-sm leading-relaxed">{msg.body}</p>
                    <p className={`mt-1 text-[10px] ${mine ? 'text-white/60' : 'text-txt-tertiary'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEnd} />
          </div>
        </div>

        {!state.outcome && (
          <div className="shrink-0 border-t border-border-subtle bg-surface px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-2xl">
              {isFreelancer && (
                <div className="mb-3 flex items-center gap-2">
                  <button
                    onClick={handleDecline}
                    className="flex items-center gap-1.5 rounded-lg border border-danger-500/30 bg-danger-50 px-3.5 py-2 text-sm font-medium text-danger-600 transition hover:bg-danger-100 dark:bg-danger-50/20 dark:border-danger-500/30"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                    Decline
                  </button>
                  <button
                    onClick={() => setShowAgreement(true)}
                    className="flex items-center gap-1.5 rounded-lg bg-success-600 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-success-600/90 shadow-soft"
                  >
                    <CheckIcon className="h-3.5 w-3.5" />
                    Accept
                  </button>
                </div>
              )}

              <div className="mb-2 flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => setInput(reply)}
                    className="shrink-0 rounded-full border border-border-subtle bg-surface px-3 py-1.5 text-xs font-medium text-txt-secondary transition-all hover:bg-inset hover:border-border-strong hover:text-txt-primary dark:bg-elevated"
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..."
                  className="input-field flex-1"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="rounded-lg bg-accent-600 p-2.5 text-white transition hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <SendIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showAgreement && (
        <AgreementModal
          agreementText={state.job.agreementText}
          jobTitle={state.job.title}
          onConfirm={handleSign}
          onBack={() => setShowAgreement(false)}
        />
      )}
    </>
  );
}
