'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { getSocket } from '@/lib/socket';
import { useBoard } from '@/lib/store';
import type { ChatMessage, NegotiationState } from '@/lib/types';
import { SendIcon, CheckIcon, XIcon, ArrowLeftIcon } from './icons';
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
  const clientId = state.job.clientId;
  const clientName = state.job.clientName;

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

  const otherName = isFreelancer ? clientName : (state.messages.find((m) => m.senderId !== myUserId)?.senderName || 'Client');
  const otherInitials = otherName.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <>
      <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
        {/* Sticky Chat Header */}
        <div className="shrink-0 border-b border-border-subtle bg-surface px-4 py-2.5 z-10">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <Link href={isFreelancer ? `/client/${clientId}` : '#'} className="flex items-center gap-3 min-w-0 flex-1">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-50 text-sm font-bold text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">
                {otherInitials}
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-txt-primary truncate">{otherName}</p>
                  <span className="inline-block h-2 w-2 rounded-full bg-success-500 shrink-0" />
                </div>
                <p className="text-[10px] text-txt-tertiary">Online</p>
              </div>
            </Link>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-txt-tertiary truncate max-w-[120px]">{state.job.title}</p>
              <p className="text-xs font-semibold text-accent-600">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(state.job.budgetCents / 100)}
              </p>
            </div>
          </div>
        </div>

        {/* Outcome Banner */}
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

        {/* Freelancer Action Buttons — pinned above messages */}
        {!state.outcome && isFreelancer && (
          <div className="shrink-0 border-b border-border-subtle bg-surface px-4 py-2.5">
            <div className="mx-auto max-w-2xl flex items-center gap-2">
              <button
                onClick={handleDecline}
                className="flex items-center gap-1.5 rounded-lg border border-danger-500/30 bg-danger-50 px-3 py-1.5 text-xs font-medium text-danger-600 transition hover:bg-danger-100 dark:bg-danger-50/20"
              >
                <XIcon className="h-3 w-3" />
                Decline
              </button>
              <button
                onClick={() => setShowAgreement(true)}
                className="flex items-center gap-1.5 rounded-lg bg-success-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-success-600/90 shadow-soft"
              >
                <CheckIcon className="h-3 w-3" />
                Accept Deal
              </button>
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mx-auto max-w-2xl space-y-1.5">
            {state.messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="mb-2 rounded-full bg-accent-50 p-3 dark:bg-accent-50/20">
                  <SendIcon className="h-5 w-5 text-accent-500" />
                </div>
                <p className="text-sm font-medium text-txt-secondary">Start the conversation</p>
                <p className="mt-1 text-xs text-txt-tertiary">Messages are visible to both participants</p>
              </div>
            )}

            {state.messages.map((msg, i) => {
              const mine = msg.senderId === myUserId;
              const prevMsg = i > 0 ? state.messages[i - 1] : null;
              const showTail = !prevMsg || prevMsg.senderId !== msg.senderId;

              return (
                <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'} ${showTail ? 'mt-3' : 'mt-0.5'}`}>
                  <div className={`max-w-[78%] px-3 py-2 ${
                    mine
                      ? 'bg-accent-600 text-white rounded-2xl rounded-br-md'
                      : 'bg-inset text-txt-primary rounded-2xl rounded-bl-md'
                  }`}>
                    <p className="text-[13.5px] leading-relaxed break-words">{msg.body}</p>
                    <p className={`mt-0.5 text-[10px] text-right ${mine ? 'text-white/50' : 'text-txt-tertiary'}`}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEnd} />
          </div>
        </div>

        {/* Input Area */}
        {!state.outcome && (
          <div className="shrink-0 border-t border-border-subtle bg-surface px-4 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))]">
            <div className="mx-auto max-w-2xl">
              <div className="mb-2 flex gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => setInput(reply)}
                    className="shrink-0 rounded-full border border-border-subtle bg-surface px-3 py-1 text-[11px] font-medium text-txt-secondary transition-all hover:bg-inset hover:border-border-strong hover:text-txt-primary dark:bg-elevated"
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
                  className="rounded-full bg-accent-600 p-2.5 text-white transition hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-soft"
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
