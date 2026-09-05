'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { JobCard } from '@/components/JobCard';
import { ReviewModal } from '@/components/ReviewModal';
import {
  DollarIcon, FolderIcon, UsersIcon, BarChartIcon,
  ClockIcon, CheckIcon, StarIcon, ChevronRightIcon,
} from '@/components/icons';
import type { FeedJob, Project, Review } from '@/lib/types';

type Tab = 'active' | 'negotiating' | 'ongoing' | 'completed';

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

export default function ClientDashboard() {
  const router = useRouter();
  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('active');
  const [jobs, setJobs] = useState<FeedJob[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewModalProject, setReviewModalProject] = useState<Project | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setUser(me.user);
        const [jobsRes, projectsRes, reviewsRes] = await Promise.all([
          api.myJobs(),
          api.getProjects(),
          api.getReviews(),
        ]);
        setJobs(jobsRes.jobs);
        setProjects(projectsRes.projects);
        setReviews(reviewsRes.reviews);
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

  const activeJobs = jobs.filter((j) => j.status === 'OPEN');
  const negotiatingJobs = jobs.filter((j) => j.status === 'NEGOTIATING');
  const ongoingJobs = jobs.filter((j) => j.status === 'IN_PROGRESS');
  const completedJobs = jobs.filter((j) => j.status === 'COMPLETED');

  const stats = [
    { label: 'Active Listings', value: activeJobs.length, icon: FolderIcon, color: 'text-accent-600' },
    { label: 'In Negotiation', value: negotiatingJobs.length, icon: UsersIcon, color: 'text-warning-500' },
    { label: 'Ongoing Projects', value: ongoingJobs.length, icon: BarChartIcon, color: 'text-success-500' },
    { label: 'Completed', value: completedJobs.length, icon: CheckIcon, color: 'text-txt-tertiary' },
  ];

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'active', label: 'Active Listings', count: activeJobs.length },
    { key: 'negotiating', label: 'In Negotiation', count: negotiatingJobs.length },
    { key: 'ongoing', label: 'Ongoing', count: ongoingJobs.length },
    { key: 'completed', label: 'Completed', count: completedJobs.length },
  ];

  return (
    <>
      <Header />
      <main className="page-container">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-txt-primary tracking-tight">Client Dashboard</h1>
          <p className="mt-1 text-sm text-txt-secondary">Manage your job listings and projects</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center gap-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-xs text-txt-secondary">{stat.label}</span>
              </div>
              <span className="text-2xl font-semibold text-txt-primary">{stat.value}</span>
            </div>
          ))}
        </div>

        <div className="mb-4 flex items-center gap-1 border-b border-border-subtle overflow-x-auto">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm transition-colors ${
                tab === t.key ? 'tab-active' : 'tab-inactive'
              }`}>
              {t.label}
              {t.count > 0 && (
                <span className="ml-1.5 rounded-full bg-accent-50 px-1.5 py-0.5 text-xs text-accent-700">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="animate-fade-in">
          {tab === 'active' && (
            <div>
              {activeJobs.length === 0 ? (
                <EmptyState
                  icon={FolderIcon}
                  title="No active listings"
                  description="Post a job to start finding freelancers"
                  action={{ label: 'Post Job', onClick: () => router.push('/post') }}
                />
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {activeJobs.map((job) => <JobCard key={job.id} job={job} />)}
                </div>
              )}
            </div>
          )}

          {tab === 'negotiating' && (
            <div>
              {negotiatingJobs.length === 0 ? (
                <EmptyState
                  icon={UsersIcon}
                  title="No negotiations in progress"
                  description="When a freelancer locks your job, it will appear here"
                />
              ) : (
                <div className="space-y-3">
                  {negotiatingJobs.map((job) => (
                    <div key={job.id} className="card p-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-txt-primary truncate">{job.title}</h3>
                        <p className="text-xs text-txt-secondary mt-0.5">
                          Locked by {job.freelancerName} · {timeAgo(job.lockedAt!)}
                        </p>
                      </div>
                      <span className="badge-warning ml-3">Negotiating</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'ongoing' && (
            <div>
              {ongoingJobs.length === 0 ? (
                <EmptyState
                  icon={BarChartIcon}
                  title="No ongoing projects"
                  description="Projects move here after the agreement is signed"
                />
              ) : (
                <div className="space-y-3">
                  {ongoingJobs.map((job) => {
                    const project = projects.find((p) => p.jobId === job.id);
                    return (
                      <div key={job.id} className="card p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-txt-primary truncate">{job.title}</h3>
                          <p className="text-xs text-txt-secondary mt-0.5">
                            {job.freelancerName} · {formatBudget(job.budgetCents)}
                          </p>
                          {project && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 max-w-[200px] rounded-full bg-inset overflow-hidden">
                                <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${project.progress}%` }} />
                              </div>
                              <span className="text-xs text-txt-tertiary">{project.progress}%</span>
                            </div>
                          )}
                        </div>
                        {project && (
                          <button onClick={() => router.push(`/workspace/${project.id}`)}
                            className="btn-secondary text-xs ml-3">
                            View <ChevronRightIcon className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'completed' && (
            <div>
              {completedJobs.length === 0 ? (
                <EmptyState
                  icon={CheckIcon}
                  title="No completed projects yet"
                  description="Finished projects will appear here"
                />
              ) : (
                <div className="space-y-3">
                  {completedJobs.map((job) => {
                    const existingReview = reviews.find((r) => r.jobId === job.id);
                    return (
                      <div key={job.id} className="card p-4 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-txt-primary truncate">{job.title}</h3>
                          <p className="text-xs text-txt-secondary mt-0.5">
                            {job.freelancerName} · {formatBudget(job.budgetCents)}
                          </p>
                        </div>
                        {existingReview ? (
                          <div className="flex items-center gap-1 ml-3">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <StarIcon key={s} className="h-3.5 w-3.5 text-warning-500" filled={s <= existingReview.rating} />
                            ))}
                            <span className="text-xs text-txt-tertiary ml-1">Reviewed</span>
                          </div>
                        ) : (
                          <button onClick={() => {
                            const project = projects.find((p) => p.jobId === job.id);
                            if (project) setReviewModalProject(project);
                          }} className="btn-secondary text-xs ml-3">
                            Leave Review
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {reviewModalProject && (
        <ReviewModal
          project={reviewModalProject}
          onClose={() => setReviewModalProject(null)}
          onSubmit={async (rating, comment) => {
            await api.submitReview({ projectId: reviewModalProject.id, rating, comment });
            setReviewModalProject(null);
            const reviewsRes = await api.getReviews();
            setReviews(reviewsRes.reviews);
          }}
        />
      )}

      <Toast />
    </>
  );
}

function EmptyState({ icon: Icon, title, description, action }: {
  icon: any; title: string; description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-inset">
        <Icon className="h-6 w-6 text-txt-tertiary" />
      </div>
      <h3 className="text-sm font-semibold text-txt-primary">{title}</h3>
      <p className="mt-1 text-sm text-txt-secondary max-w-sm">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn-primary mt-4">{action.label}</button>
      )}
    </div>
  );
}
