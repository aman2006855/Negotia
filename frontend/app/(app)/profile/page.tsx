'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { StarIcon, ShareIcon, LogOutIcon, SunIcon, MoonIcon, ExternalLinkIcon } from '@/components/icons';
import { signOut } from '@/lib/supabase';
import type { Review } from '@/lib/types';

const EXP_LABEL: Record<string, string> = { '0-1': '0–1 years', '1-3': '1–3 years', '3+': '3+ years' };

export default function ProfilePage() {
  const router = useRouter();
  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const reviews = useBoard((s) => s.reviews);
  const setReviews = useBoard((s) => s.setReviews);
  const theme = useBoard((s) => s.theme);
  const toggleTheme = useBoard((s) => s.toggleTheme);
  const logout = useBoard((s) => s.logout);
  const showToast = useBoard((s) => s.showToast);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!user) {
        try {
          const me = await api.me();
          if (me.user) setUser(me.user);
        } catch {}
      }
      try {
        const r = await api.getReviews(user?.id);
        setReviews(r);
      } catch {}
      setLoading(false);
    })();
  }, [setReviews, setUser, user]);

  function handleShare() {
    const url = `${window.location.origin}/client/${user?.id}`;
    navigator.clipboard.writeText(url).then(() => showToast('Profile link copied'));
  }

  async function handleLogout() {
    await signOut();
    logout();
    router.push('/login');
  }

  if (!user) return null;

  const initials = user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      {/* ─── Banner + Avatar ─── */}
      <div className="relative">
        <div className="h-32 sm:h-40 rounded-t-2xl bg-gradient-to-r from-accent-600 via-accent-500 to-blue-500" />
        <div className="absolute -bottom-10 left-6">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name}
              className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-surface object-cover shadow-medium" />
          ) : (
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-4 border-surface bg-accent-100 text-2xl sm:text-3xl font-bold text-accent-700 shadow-medium">
              {initials}
            </div>
          )}
        </div>
      </div>

      {/* ─── Identity ─── */}
      <div className="px-6 pt-14 pb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-txt-primary">{user.name}</h1>
            <p className="text-sm text-txt-secondary mt-0.5">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleShare}
              className="p-2 rounded-xl border border-border-subtle bg-surface text-txt-secondary hover:bg-inset hover:text-txt-primary transition-all">
              <ShareIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5 mt-3 flex-wrap">
          <span className="inline-flex items-center rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 border border-accent-200/60">
            {user.role === 'FREELANCER' ? 'Freelancer' : 'Client'}
          </span>
          {user.experience && (
            <span className="inline-flex items-center rounded-full bg-inset px-3 py-1 text-xs font-medium text-txt-secondary">
              {EXP_LABEL[user.experience] ?? user.experience}
            </span>
          )}
          {user.rating > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-3 py-1 text-xs font-medium text-warning-600 border border-warning-500/20">
              <StarIcon className="h-3 w-3" filled /> {user.rating.toFixed(1)} ({user.reviewCount})
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { label: 'Completed', value: user.completedJobs, icon: '✓' },
            { label: 'Active', value: user.activeJobs, icon: '●' },
            { label: 'Earnings', value: `$${((user.totalEarningsCents) / 100).toLocaleString()}`, icon: '$' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface border border-border-subtle p-3.5 text-center shadow-soft">
              <div className="text-lg font-bold text-txt-primary">{stat.value}</div>
              <div className="text-[11px] font-medium text-txt-tertiary mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Skills ─── */}
      {user.skills.length > 0 && (
        <div className="px-6 mb-6">
          <div className="rounded-2xl bg-surface border border-border-subtle p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-txt-primary mb-3">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((s) => (
                <span key={s} className="inline-flex items-center rounded-full bg-accent-50 border border-accent-200/60 px-3 py-1.5 text-xs font-medium text-accent-700 hover:bg-accent-100 transition-colors cursor-default">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Capabilities ─── */}
      {user.capabilities && (
        <div className="px-6 mb-6">
          <div className="rounded-2xl bg-surface border border-border-subtle p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-txt-primary mb-2">About</h2>
            <p className="text-sm text-txt-secondary leading-relaxed">{user.capabilities}</p>
          </div>
        </div>
      )}

      {/* ─── Portfolio Links ─── */}
      {user.portfolioLinks.length > 0 && (
        <div className="px-6 mb-6">
          <div className="rounded-2xl bg-surface border border-border-subtle p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-txt-primary mb-3">Portfolio</h2>
            <div className="space-y-2">
              {user.portfolioLinks.map((link) => (
                <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm text-accent-600 hover:bg-accent-50 transition-colors group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 text-accent-600 group-hover:bg-accent-100 transition-colors">
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{link.label || 'Link'}</div>
                    <div className="text-xs text-txt-tertiary truncate">{link.url}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Past Work ─── */}
      {user.pastWork.length > 0 && (
        <div className="px-6 mb-6">
          <div className="rounded-2xl bg-surface border border-border-subtle p-5 shadow-soft">
            <h2 className="text-sm font-semibold text-txt-primary mb-3">Past Work</h2>
            <div className="space-y-3">
              {user.pastWork.map((work, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-inset p-3.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border-subtle text-txt-secondary text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-txt-primary">{work.title}</div>
                    {'url' in work && (work as any).url && (
                      <a href={(work as any).url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-accent-600 hover:text-accent-700 truncate block mt-0.5">
                        {(work as any).url}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Reviews ─── */}
      <div className="px-6 mb-6">
        <div className="rounded-2xl bg-surface border border-border-subtle p-5 shadow-soft">
          <h2 className="text-sm font-semibold text-txt-primary mb-4">Reviews</h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 rounded-xl border-2 border-dashed border-border-subtle bg-inset/50">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface border border-border-subtle mb-3">
                <StarIcon className="h-5 w-5 text-txt-tertiary" />
              </div>
              <p className="text-sm font-medium text-txt-secondary">No reviews yet</p>
              <p className="text-xs text-txt-tertiary mt-1 text-center max-w-[200px]">Complete jobs to build your reputation</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl bg-inset p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} className="h-3.5 w-3.5 text-warning-500" filled={star <= review.rating} />
                      ))}
                    </div>
                    <span className="text-[11px] text-txt-tertiary">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-txt-primary leading-relaxed">{review.comment}</p>
                  <div className="flex items-center gap-2 mt-2.5 pt-2.5 border-t border-border-subtle">
                    <div className="text-xs text-txt-tertiary">by</div>
                    <div className="text-xs font-medium text-txt-secondary">{review.clientName}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── Settings ─── */}
      <div className="px-6 mb-6">
        <div className="rounded-2xl bg-surface border border-border-subtle p-2 shadow-soft">
          <button onClick={toggleTheme}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-txt-secondary hover:bg-inset transition-colors">
            {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </button>
          <div className="mx-4 border-t border-border-subtle" />
          <button onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-danger-600 hover:bg-danger-50 transition-colors">
            <LogOutIcon className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
