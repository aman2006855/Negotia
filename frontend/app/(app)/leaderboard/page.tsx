'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LaunchCard } from '@/components/marketplace/LaunchCard';
import { MarketplaceTabs } from '@/components/marketplace/MarketplaceTabs';
import type { MarketListing } from '@/lib/types';

export default function LeaderboardPage() {
  const [launches, setLaunches] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const all = await api.leaderboard(30);
        setLaunches(all);
      } catch {}
      setLoading(false);
    })();
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <MarketplaceTabs />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="page-container py-4 max-w-lg mx-auto">
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-txt-primary tracking-tight">🏆 Leaderboard</h1>
            <p className="text-sm text-txt-secondary mt-1">Top-rated launches this week.</p>
          </div>

          {loading ? (
            <div className="py-12 text-center text-txt-tertiary text-sm">Loading...</div>
          ) : launches.length === 0 ? (
            <div className="py-12 text-center text-txt-tertiary text-sm">No rated launches yet. Rate something on the Launches tab!</div>
          ) : (
            <div className="flex flex-col gap-3">
              {launches.map((l, i) => (
                <div key={l.id} className="relative">
                  {i < 3 && (
                    <div className="absolute -left-1 -top-1 text-2xl z-10">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                  <LaunchCard listing={l} rank={i + 1} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
