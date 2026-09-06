'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { ArrowLeftIcon, CheckIcon, PlusIcon, SendIcon } from '@/components/icons';
import type { Project } from '@/lib/types';

function formatBudget(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-inset text-txt-tertiary border border-border-subtle',
  IN_PROGRESS: 'bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-50/20 dark:text-accent-400 dark:border-accent-500/30',
  DONE: 'bg-success-50 text-success-600 border border-success-500/20 dark:bg-success-50/20',
};

export default function WorkspaceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [newMilestone, setNewMilestone] = useState('');
  const user = useBoard((s) => s.user);

  useEffect(() => {
    (async () => {
      try {
        const { project: p } = await api.getProject(id);
        setProject(p);
      } catch {
        setError('Project not found');
      }
    })();
  }, [id]);

  async function handleSendMessage() {
    if (!input.trim() || !project) return;
    const result = await api.sendWorkspaceMessage(project.id, input.trim());
    setProject(result.project);
    setInput('');
  }

  async function handleToggleMilestone(milestoneId: string) {
    if (!project) return;
    try {
      const result = await api.toggleMilestone(project.id, milestoneId);
      setProject(result.project);
    } catch {}
  }

  async function handleAddMilestone() {
    if (!newMilestone.trim() || !project) return;
    const result = await api.addMilestone(project.id, newMilestone.trim());
    setProject(result.project);
    setNewMilestone('');
  }

  if (error) {
    return (
      <div className="page-container flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-sm text-danger-600 mb-3">{error}</p>
        <button onClick={() => router.push('/workspace')} className="btn-primary">Back to workspace</button>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="page-container flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="page-container pb-24">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => router.push('/workspace')} className="rounded-lg p-1.5 text-txt-tertiary hover:bg-inset hover:text-txt-primary transition-colors">
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold text-txt-primary truncate">{project.title}</h1>
          <p className="text-xs text-txt-secondary">{project.clientName} · {formatBudget(project.budgetCents)}</p>
        </div>
      </div>

      <div className="card mb-4 p-4">
        <div className="flex items-center justify-between text-xs text-txt-secondary mb-2">
          <span>Overall progress</span>
          <span className="font-medium text-txt-primary">{project.progress}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-inset">
          <div className="h-full rounded-full bg-accent-600 transition-all duration-500" style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="mb-4">
        <h2 className="section-title mb-3 text-sm">Milestones</h2>
        <div className="space-y-2">
          {project.milestones.map((ms) => (
            <button
              key={ms.id}
              onClick={() => handleToggleMilestone(ms.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all ${STATUS_COLORS[ms.status]}`}
            >
              <CheckIcon className={`h-4 w-4 shrink-0 ${ms.status === 'DONE' ? 'text-success-500' : 'text-txt-tertiary'}`} />
              <span className={ms.status === 'DONE' ? 'line-through opacity-60' : ''}>{ms.title}</span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={newMilestone}
            onChange={(e) => setNewMilestone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
            placeholder="Add a milestone..."
            className="input-field text-xs flex-1"
          />
          <button onClick={handleAddMilestone} disabled={!newMilestone.trim()} className="btn-primary px-3 py-1.5 text-xs disabled:opacity-40">
            <PlusIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div>
        <h2 className="section-title mb-3 text-sm">Discussion</h2>
        <div className="card p-3 space-y-2 max-h-64 overflow-y-auto scrollbar-thin mb-3">
          {project.messages.length === 0 && (
            <p className="text-xs text-txt-tertiary text-center py-4">No messages yet</p>
          )}
          {project.messages.map((msg) => {
            const mine = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
                  mine ? 'bg-accent-600 text-white rounded-br-sm' : 'bg-inset text-txt-primary rounded-bl-sm'
                }`}>
                  <p className="text-xs font-medium mb-0.5">{msg.senderName}</p>
                  <p className="text-sm">{msg.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? 'text-white/60' : 'text-txt-tertiary'}`}>{formatTime(msg.createdAt)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="input-field flex-1"
          />
          <button onClick={handleSendMessage} disabled={!input.trim()} className="btn-primary px-3 py-2.5 disabled:opacity-40">
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
