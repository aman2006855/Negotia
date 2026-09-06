'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { ChevronRightIcon } from '@/components/icons';
import type { Project } from '@/lib/types';

function formatBudget(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

const STATUS_BADGE: Record<string, string> = {
  NOT_STARTED: 'badge-neutral',
  IN_PROGRESS: 'badge-success',
  IN_REVIEW: 'badge-warning',
  COMPLETED: 'badge-neutral',
};

export default function WorkspacePage() {
  const projects = useBoard((s) => s.projects);
  const setProjects = useBoard((s) => s.setProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await api.getProjects();
        setProjects(p);
      } catch {}
      setLoading(false);
    })();
  }, [setProjects]);

  return (
    <div className="page-container">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-txt-primary">Workspace</h1>
        <p className="text-xs text-txt-secondary">Your active and completed projects</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-txt-secondary">No projects yet</p>
          <p className="mt-1 text-xs text-txt-tertiary">Accept a negotiation to create your first project</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/workspace/${project.id}`}
              className="card block p-4 transition-all hover:shadow-medium hover:border-border-strong"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-txt-primary line-clamp-1">{project.title}</h3>
                  <p className="mt-0.5 text-xs text-txt-secondary truncate">{project.clientName} · {formatBudget(project.budgetCents)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE[project.status] || 'badge-neutral'}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                  <ChevronRightIcon className="h-4 w-4 text-txt-tertiary" />
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-txt-tertiary mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-inset">
                  <div
                    className="h-full rounded-full bg-accent-600 transition-all duration-500"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {project.milestones.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5 text-[10px] text-txt-tertiary">
                  <span>{project.milestones.filter((m) => m.status === 'DONE').length}/{project.milestones.length} milestones</span>
                </div>
              )}
              <div className="mt-2 text-[10px] text-txt-tertiary flex items-center gap-1">
                <span>ℹ️</span>
                <span>Payment settled directly — platform has no role</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
