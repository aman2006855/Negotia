'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import {
  SendIcon, PlusIcon, CheckIcon, ClockIcon, PlayIcon,
  PauseIcon, TargetIcon, MessageIcon, ChevronRightIcon, ArrowLeftIcon,
} from '@/components/icons';
import type { Project, MilestoneStatus } from '@/lib/types';

function formatBudget(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

type WSTab = 'overview' | 'discussion' | 'milestones';

const STATUS_OPTIONS = [
  { value: 'NOT_STARTED', label: 'Not Started', icon: PauseIcon, color: 'text-txt-tertiary' },
  { value: 'IN_PROGRESS', label: 'In Progress', icon: PlayIcon, color: 'text-accent-600' },
  { value: 'IN_REVIEW', label: 'In Review', icon: TargetIcon, color: 'text-warning-500' },
  { value: 'COMPLETED', label: 'Completed', icon: CheckIcon, color: 'text-success-500' },
] as const;

const MILESTONE_ICONS: Record<MilestoneStatus, typeof CheckIcon> = {
  TODO: ClockIcon,
  IN_PROGRESS: PlayIcon,
  DONE: CheckIcon,
};

const MILESTONE_COLORS: Record<MilestoneStatus, string> = {
  TODO: 'text-txt-tertiary bg-inset',
  IN_PROGRESS: 'text-accent-600 bg-accent-50',
  DONE: 'text-success-600 bg-success-50',
};

export default function WorkspacePage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;
  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const showToast = useBoard((s) => s.showToast);

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<WSTab>('overview');
  const [message, setMessage] = useState('');
  const [newMilestone, setNewMilestone] = useState('');
  const [showMilestoneInput, setShowMilestoneInput] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setUser(me.user);
        const { project: p } = await api.getProject(projectId);
        setProject(p);
        setProgressValue(p.progress);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [project?.messages.length]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (!project) return null;

  const p = project;
  const isFreelancer = user?.role === 'FREELANCER';

  async function handleSendMessage() {
    if (!message.trim() || !p) return;
    try {
      await api.sendWorkspaceMessage(p.id, message.trim());
      const { project: updated } = await api.getProject(p.id);
      setProject(updated);
      setMessage('');
    } catch {
      showToast('Failed to send message');
    }
  }

  async function handleAddMilestone() {
    if (!newMilestone.trim() || !p) return;
    try {
      await api.addMilestone(p.id, newMilestone.trim());
      const { project: updated } = await api.getProject(p.id);
      setProject(updated);
      setNewMilestone('');
      setShowMilestoneInput(false);
    } catch {
      showToast('Failed to add milestone');
    }
  }

  async function handleToggleMilestone(milestoneId: string) {
    if (!p) return;
    try {
      await api.toggleMilestone(p.id, milestoneId);
      const { project: updated } = await api.getProject(p.id);
      setProject(updated);
    } catch {
      showToast('Failed to update milestone');
    }
  }

  async function handleProgressChange(value: number) {
    setProgressValue(value);
    if (!p) return;
    try {
      await api.updateProjectProgress(p.id, value);
      const { project: updated } = await api.getProject(p.id);
      setProject(updated);
    } catch {
      showToast('Failed to update progress');
    }
  }

  async function handleStatusChange(status: string) {
    if (!p) return;
    try {
      await api.updateProjectStatus(p.id, status);
      const { project: updated } = await api.getProject(p.id);
      setProject(updated);
    } catch {
      showToast('Failed to update status');
    }
  }

  const completedMilestones = p.milestones.filter((m) => m.status === 'DONE').length;
  const totalMilestones = p.milestones.length;

  return (
    <>
      <Header />
      <main className="page-container max-w-5xl">
        <button onClick={() => router.push('/')} className="btn-ghost text-xs mb-4 -ml-2">
          <ArrowLeftIcon className="h-3.5 w-3.5" /> Back to dashboard
        </button>

        <div className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold text-txt-primary tracking-tight">{p.title}</h1>
              <p className="mt-1 text-sm text-txt-secondary">
                {isFreelancer ? `Client: ${p.clientName}` : `Freelancer: ${p.freelancerName}`} · {formatBudget(p.budgetCents)}
              </p>
            </div>
            {isFreelancer && (
              <select value={p.status} onChange={(e) => handleStatusChange(e.target.value)}
                className="input-field text-xs w-auto">
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center gap-1 border-b border-border-subtle">
              {(['overview', 'discussion', 'milestones'] as WSTab[]).map((t) => (
                <button key={t} onClick={() => setTab(t)}
                  className={`whitespace-nowrap px-4 py-2.5 text-sm transition-colors capitalize ${
                    tab === t ? 'tab-active' : 'tab-inactive'
                  }`}>
                  {t}
                </button>
              ))}
            </div>

            <div className="animate-fade-in">
              {tab === 'overview' && (
                <div className="space-y-4">
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-txt-primary mb-3">Project Details</h3>
                    <p className="text-sm text-txt-secondary leading-relaxed">{p.description}</p>
                  </div>

                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-txt-primary mb-3">Agreement</h3>
                    <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-wrap">{p.agreementText}</p>
                  </div>

                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-txt-primary mb-3">Progress</h3>
                    <div className="flex items-center gap-4">
                      <div className="h-3 flex-1 rounded-full bg-inset overflow-hidden">
                        <div className="h-full rounded-full bg-accent-500 transition-all duration-300"
                          style={{ width: `${progressValue}%` }} />
                      </div>
                      <span className="text-sm font-medium text-txt-primary w-12 text-right">{progressValue}%</span>
                    </div>
                    {isFreelancer && (
                      <input type="range" min="0" max="100" value={progressValue}
                        onChange={(e) => handleProgressChange(Number(e.target.value))}
                        className="w-full mt-3 accent-accent-600" />
                    )}
                  </div>
                </div>
              )}

              {tab === 'discussion' && (
                <div className="card flex flex-col h-[500px]">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                    {p.messages.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageIcon className="h-8 w-8 text-txt-tertiary mb-2" />
                        <p className="text-sm text-txt-secondary">No messages yet</p>
                        <p className="text-xs text-txt-tertiary mt-1">Start a conversation about the project</p>
                      </div>
                    ) : (
                      p.messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 ${
                            msg.senderId === user?.id
                              ? 'bg-accent-600 text-white rounded-br-sm'
                              : 'bg-surface border border-border-subtle text-txt-primary rounded-bl-sm'
                          }`}>
                            {msg.senderId !== user?.id && (
                              <p className="mb-0.5 text-xs font-medium text-accent-600">{msg.senderName}</p>
                            )}
                            <p className="text-sm leading-relaxed">{msg.body}</p>
                            <p className={`mt-1 text-[10px] ${msg.senderId === user?.id ? 'text-white/60' : 'text-txt-tertiary'}`}>
                              {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="border-t border-border-subtle p-3">
                    <div className="flex items-center gap-2">
                      <input type="text" value={message} onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="input-field flex-1" placeholder="Type a message..." />
                      <button onClick={handleSendMessage} disabled={!message.trim()} className="btn-primary px-3 py-2">
                        <SendIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'milestones' && (
                <div className="space-y-3">
                  {p.milestones.map((ms) => {
                    const Icon = MILESTONE_ICONS[ms.status];
                    const colorClass = MILESTONE_COLORS[ms.status];
                    return (
                      <div key={ms.id} className="card p-4 flex items-center gap-3">
                        <button onClick={() => isFreelancer && handleToggleMilestone(ms.id)}
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass} ${
                            isFreelancer ? 'hover:opacity-80 transition-opacity cursor-pointer' : 'cursor-default'
                          }`}>
                          <Icon className="h-4 w-4" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm ${ms.status === 'DONE' ? 'line-through text-txt-tertiary' : 'text-txt-primary'}`}>
                            {ms.title}
                          </span>
                        </div>
                        <span className={`badge-${ms.status === 'DONE' ? 'success' : ms.status === 'IN_PROGRESS' ? 'warning' : 'neutral'} text-[10px]`}>
                          {ms.status.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}

                  {isFreelancer && (
                    showMilestoneInput ? (
                      <div className="card p-3 flex items-center gap-2">
                        <input type="text" value={newMilestone} onChange={(e) => setNewMilestone(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddMilestone()}
                          className="input-field flex-1" placeholder="Milestone title" autoFocus />
                        <button onClick={handleAddMilestone} className="btn-primary px-3 py-2 text-xs">Add</button>
                        <button onClick={() => { setShowMilestoneInput(false); setNewMilestone(''); }}
                          className="btn-ghost px-2 py-2 text-xs">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowMilestoneInput(true)}
                        className="card p-3 w-full flex items-center gap-2 text-sm text-txt-secondary hover:text-accent-600 hover:border-accent-200 transition-colors cursor-pointer">
                        <PlusIcon className="h-4 w-4" /> Add milestone
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-4">
              <h4 className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider mb-3">Summary</h4>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-secondary">Budget</span>
                  <span className="text-sm font-medium text-txt-primary">{formatBudget(p.budgetCents)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-secondary">Status</span>
                  <span className={`badge-${p.status === 'COMPLETED' ? 'success' : p.status === 'IN_REVIEW' ? 'warning' : 'neutral'} text-[10px]`}>
                    {p.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-secondary">Progress</span>
                  <span className="text-sm font-medium text-txt-primary">{p.progress}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-txt-secondary">Milestones</span>
                  <span className="text-sm font-medium text-txt-primary">{completedMilestones}/{totalMilestones}</span>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <h4 className="text-xs font-semibold text-txt-tertiary uppercase tracking-wider mb-3">Team</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-50 text-xs font-medium text-accent-700">
                    {p.clientName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-txt-primary">{p.clientName}</p>
                    <p className="text-[10px] text-txt-tertiary">Client</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-success-50 text-xs font-medium text-success-600">
                    {p.freelancerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-txt-primary">{p.freelancerName}</p>
                    <p className="text-[10px] text-txt-tertiary">Freelancer</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Toast />
    </>
  );
}
