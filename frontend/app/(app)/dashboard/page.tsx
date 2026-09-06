'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { DollarIcon, BriefcaseIcon, StarIcon, WalletIcon, UsersIcon } from '@/components/icons';
import type { DashboardStats } from '@/lib/types';

function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(cents / 100);
}

export default function DashboardPage() {
  const stats = useBoard((s) => s.dashboardStats);
  const setStats = useBoard((s) => s.setDashboardStats);
  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const projects = useBoard((s) => s.projects);
  const showToast = useBoard((s) => s.showToast);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          const me = await api.me();
          if (me.user) setUser(me.user);
        }
        const s = await api.getDashboardStats();
        setStats(s);
      } catch {}
      setLoading(false);
    })();
  }, [user, setUser, setStats]);

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  const isFreelancer = user?.role === 'FREELANCER';

  const statCards = isFreelancer
    ? [
        { label: 'Total Earnings', value: formatCents(stats?.totalEarningsCents ?? 0), icon: DollarIcon, color: 'text-success-600 bg-success-50 dark:bg-success-50/20' },
        { label: 'Pending', value: formatCents(stats?.pendingPaymentsCents ?? 0), icon: WalletIcon, color: 'text-warning-600 bg-warning-50 dark:bg-warning-50/20', showPayout: true },
        { label: 'Active Projects', value: String(stats?.activeProjects ?? 0), icon: BriefcaseIcon, color: 'text-accent-600 bg-accent-50 dark:bg-accent-50/20' },
        { label: 'Average Rating', value: stats?.averageRating ? `${stats.averageRating.toFixed(1)} ★` : '—', icon: StarIcon, color: 'text-txt-primary bg-inset' },
      ]
    : [
        { label: 'Total Spent', value: formatCents(stats?.totalEarningsCents ?? 0), icon: DollarIcon, color: 'text-accent-600 bg-accent-50 dark:bg-accent-50/20' },
        { label: 'Active Hires', value: String(stats?.activeProjects ?? 0), icon: UsersIcon, color: 'text-success-600 bg-success-50 dark:bg-success-50/20' },
        { label: 'Projects Completed', value: String(stats?.completedProjects ?? 0), icon: BriefcaseIcon, color: 'text-txt-primary bg-inset' },
        { label: 'Avg Rating Given', value: stats?.averageRating ? `${stats.averageRating.toFixed(1)} ★` : '—', icon: StarIcon, color: 'text-warning-600 bg-warning-50 dark:bg-warning-50/20' },
      ];

  return (
    <div className="page-container">
      <div className="mb-4">
        <h1 className="text-lg font-semibold text-txt-primary">Dashboard</h1>
        <p className="text-xs text-txt-secondary">
          {isFreelancer ? 'Your financial overview' : 'Your spending overview'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center gap-2">
              <span className={`rounded-lg p-1.5 ${card.color}`}>
                <card.icon className="h-4 w-4" />
              </span>
              <span className="text-xs text-txt-secondary">{card.label}</span>
            </div>
            <p className="text-xl font-semibold text-txt-primary mt-1">{card.value}</p>
            {isFreelancer && card.showPayout && (stats?.pendingPaymentsCents ?? 0) > 0 && (
              <button
                onClick={() => showToast('Payout requested — processing in 1-2 business days')}
                className="mt-2 w-full rounded-lg bg-success-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-success-600/90"
              >
                Request Payout
              </button>
            )}
          </div>
        ))}
      </div>

      {!isFreelancer && (
        <button
          onClick={() => router.push('/post')}
          className="w-full rounded-xl bg-accent-600 px-4 py-3 text-sm font-semibold text-white hover:bg-accent-700 transition-colors shadow-soft mb-6"
        >
          + Post a New Job
        </button>
      )}

      {projects.length > 0 && (
        <div>
          <h2 className="section-title mb-3 text-sm">
            {isFreelancer ? 'Ongoing Projects' : 'Active Hires'}
          </h2>
          <div className="space-y-2">
            {projects.slice(0, 3).map((p) => (
              <div key={p.id} className="card p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-txt-primary truncate">{p.title}</p>
                  <span className="text-xs text-txt-tertiary">{p.progress}%</span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-inset">
                  <div className="h-full rounded-full bg-accent-600" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
