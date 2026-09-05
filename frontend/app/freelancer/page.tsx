'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { Header } from '@/components/Header';
import { Toast } from '@/components/Toast';
import { StarIcon, DollarIcon, BarChartIcon, FolderIcon, UsersIcon, ExternalLinkIcon, ChevronRightIcon } from '@/components/icons';
import type { Review, DashboardStats, User, Project } from '@/lib/types';

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

export default function FreelancerDashboard() {
  const router = useRouter();
  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [profile, setProfile] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const me = await api.me();
        setUser(me.user);
        setProfile(me.user);
        const [statsRes, reviewsRes, projectsRes] = await Promise.all([
          api.getDashboardStats(),
          api.getReviews(me.user.id),
          api.getProjects(),
        ]);
        setStats(statsRes);
        setReviews(reviewsRes.reviews);
        setProjects(projectsRes.projects);
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

  const myProjects = projects.filter((p) => p.freelancerId === user?.id);

  return (
    <>
      <Header />
      <main className="page-container">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-txt-primary tracking-tight">Freelancer Dashboard</h1>
          <p className="mt-1 text-sm text-txt-secondary">Track your earnings, projects, and reputation</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
          <div className="stat-card">
            <div className="flex items-center gap-2">
              <DollarIcon className="h-4 w-4 text-success-500" />
              <span className="text-xs text-txt-secondary">Total Earnings</span>
            </div>
            <span className="text-2xl font-semibold text-txt-primary">{formatBudget(stats?.totalEarningsCents ?? 0)}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2">
              <DollarIcon className="h-4 w-4 text-warning-500" />
              <span className="text-xs text-txt-secondary">Pending</span>
            </div>
            <span className="text-2xl font-semibold text-txt-primary">{formatBudget(stats?.pendingPaymentsCents ?? 0)}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2">
              <BarChartIcon className="h-4 w-4 text-accent-600" />
              <span className="text-xs text-txt-secondary">Active</span>
            </div>
            <span className="text-2xl font-semibold text-txt-primary">{stats?.activeProjects ?? 0}</span>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2">
              <StarIcon className="h-4 w-4 text-warning-500" filled />
              <span className="text-xs text-txt-secondary">Rating</span>
            </div>
            <span className="text-2xl font-semibold text-txt-primary">{stats?.averageRating.toFixed(1)}</span>
            <span className="text-xs text-txt-tertiary">{stats?.reviewCount} reviews</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <section>
              <h2 className="section-title mb-3">Your Projects</h2>
              {myProjects.length === 0 ? (
                <div className="card p-8 text-center">
                  <FolderIcon className="mx-auto h-8 w-8 text-txt-tertiary mb-2" />
                  <p className="text-sm text-txt-secondary">No active projects yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myProjects.map((project) => (
                    <div key={project.id} className="card p-4 hover:shadow-medium transition-all cursor-pointer"
                      onClick={() => router.push(`/workspace/${project.id}`)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-txt-primary">{project.title}</h3>
                          <p className="text-xs text-txt-secondary mt-0.5">
                            {project.clientName} · {formatBudget(project.budgetCents)}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <div className="h-1.5 flex-1 max-w-[160px] rounded-full bg-inset overflow-hidden">
                              <div className="h-full rounded-full bg-accent-500 transition-all" style={{ width: `${project.progress}%` }} />
                            </div>
                            <span className="text-xs text-txt-tertiary">{project.progress}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <span className={`badge-${project.status === 'COMPLETED' ? 'success' : project.status === 'IN_REVIEW' ? 'warning' : 'neutral'}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                          <ChevronRightIcon className="h-4 w-4 text-txt-tertiary" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="section-title mb-3">Reviews</h2>
              {reviews.length === 0 ? (
                <div className="card p-8 text-center">
                  <StarIcon className="mx-auto h-8 w-8 text-txt-tertiary mb-2" />
                  <p className="text-sm text-txt-secondary">No reviews yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((review) => (
                    <div key={review.id} className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <StarIcon key={s} className="h-3.5 w-3.5 text-warning-500" filled={s <= review.rating} />
                          ))}
                        </div>
                        <span className="text-xs text-txt-tertiary">{timeAgo(review.createdAt)}</span>
                      </div>
                      <p className="text-sm text-txt-secondary leading-relaxed">{review.comment}</p>
                      <p className="mt-2 text-xs text-txt-tertiary">— {review.clientName}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <section className="card p-5">
              <h3 className="text-sm font-semibold text-txt-primary mb-3">Profile</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-txt-tertiary">Skills</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {profile?.skills?.slice(0, 6).map((skill) => (
                      <span key={skill} className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                {profile?.experience && (
                  <div>
                    <span className="text-xs text-txt-tertiary">Experience</span>
                    <p className="text-sm text-txt-primary">{profile.experience} years</p>
                  </div>
                )}
                {profile?.portfolioLinks && profile.portfolioLinks.length > 0 && (
                  <div>
                    <span className="text-xs text-txt-tertiary">Links</span>
                    <div className="space-y-1 mt-1">
                      {profile.portfolioLinks.map((link, i) => (
                        <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700">
                          <ExternalLinkIcon className="h-3 w-3" />
                          {link.label || link.url}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="card p-5">
              <h3 className="text-sm font-semibold text-txt-primary mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => router.push('/')} className="btn-secondary w-full justify-start">
                  <FolderIcon className="h-4 w-4" /> Browse Jobs
                </button>
                <button onClick={() => router.push('/')} className="btn-secondary w-full justify-start">
                  <BarChartIcon className="h-4 w-4" /> View Active Projects
                </button>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Toast />
    </>
  );
}
