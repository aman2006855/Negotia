'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { StarIcon, ShareIcon, LogOutIcon, SunIcon, MoonIcon, ExternalLinkIcon } from '@/components/icons';
import type { Review } from '@/lib/types';

export default function ProfilePage() {
  const router = useRouter();
  const user = useBoard((s) => s.user);
  const reviews = useBoard((s) => s.reviews);
  const setReviews = useBoard((s) => s.setReviews);
  const theme = useBoard((s) => s.theme);
  const toggleTheme = useBoard((s) => s.toggleTheme);
  const logout = useBoard((s) => s.logout);
  const showToast = useBoard((s) => s.showToast);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.getReviews(user?.id);
        setReviews(r);
      } catch {}
      setLoading(false);
    })();
  }, [setReviews, user?.id]);

  function handleShare() {
    const url = `${window.location.origin}/profile/${user?.id}`;
    navigator.clipboard.writeText(url).then(() => showToast('Profile link copied'));
  }

  function handleLogout() {
    logout();
    router.push('/login');
  }

  if (!user) return null;

  return (
    <div className="page-container pb-24">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-xl font-bold text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">
          {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
        </div>
        <h1 className="text-lg font-semibold text-txt-primary">{user.name}</h1>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">{user.role}</span>
          {user.rating > 0 && (
            <span className="flex items-center gap-0.5 text-xs text-txt-secondary">
              <StarIcon className="h-3 w-3 text-warning-500" filled /> {user.rating.toFixed(1)} ({user.reviewCount})
            </span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <button onClick={handleShare} className="btn-secondary w-full">
          <ShareIcon className="h-4 w-4" />
          Share Profile
        </button>
      </div>

      {user.skills.length > 0 && (
        <div className="mb-6">
          <h2 className="section-title mb-2 text-sm">Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map((s) => (
              <span key={s} className="rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">{s}</span>
            ))}
          </div>
        </div>
      )}

      {user.experience && (
        <div className="mb-6">
          <h2 className="section-title mb-2 text-sm">Experience</h2>
          <p className="text-sm text-txt-secondary">{user.experience === '0-1' ? '0–1 years' : user.experience === '1-3' ? '1–3 years' : '3+ years'}</p>
        </div>
      )}

      {user.portfolioLinks.length > 0 && (
        <div className="mb-6">
          <h2 className="section-title mb-2 text-sm">Links</h2>
          <div className="space-y-1.5">
            {user.portfolioLinks.map((link) => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent-600 hover:bg-inset transition-colors dark:text-accent-400">
                <ExternalLinkIcon className="h-3.5 w-3.5" />
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="section-title mb-3 text-sm">Reviews</h2>
        {loading ? (
          <div className="flex justify-center py-8"><div className="h-6 w-6 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" /></div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-txt-tertiary text-center py-8">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review.id} className="card p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon key={star} className="h-3 w-3 text-warning-500" filled={star <= review.rating} />
                    ))}
                  </div>
                  <span className="text-[10px] text-txt-tertiary">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-txt-primary mb-1">{review.comment}</p>
                <p className="text-[10px] text-txt-tertiary">Review for: {review.projectTitle}</p>
                <p className="text-[10px] text-txt-tertiary">by {review.clientName}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-border-subtle pt-4">
        <button onClick={toggleTheme} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-txt-secondary hover:bg-inset transition-colors">
          {theme === 'dark' ? <SunIcon className="h-4 w-4" /> : <MoonIcon className="h-4 w-4" />}
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-50/10 transition-colors">
          <LogOutIcon className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
