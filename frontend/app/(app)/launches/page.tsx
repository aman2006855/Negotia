'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { LaunchCard } from '@/components/marketplace/LaunchCard';
import { MarketplaceTabs } from '@/components/marketplace/MarketplaceTabs';
import { MARKET_CATEGORIES } from '@/lib/constants';
import { SearchIcon } from '@/components/icons';
import type { MarketListing } from '@/lib/types';

const CATEGORIES = ['All', ...MARKET_CATEGORIES] as const;

export default function LaunchesPage() {
  const [launches, setLaunches] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    (async () => {
      try {
        const all = await api.marketFeed('SHOWCASE', { category: activeCategory, query });
        setLaunches(all);
      } catch {}
      setLoading(false);
    })();
  }, [activeCategory, query]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <MarketplaceTabs />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="page-container py-4">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-txt-primary tracking-tight">New Launches 🚀</h1>
            <p className="text-sm text-txt-secondary mt-1">Discover what the community is building.</p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
            <input
              type="text"
              placeholder="Search launches..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Categories */}
          <div className="flex overflow-x-auto gap-2 pb-3 whitespace-nowrap no-scrollbar -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  activeCategory === cat
                    ? 'bg-accent-500 text-white'
                    : 'bg-surface border border-border-subtle text-txt-secondary hover:border-accent-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Launches list */}
          {loading ? (
            <div className="py-12 text-center text-txt-tertiary text-sm">Loading...</div>
          ) : launches.length === 0 ? (
            <div className="py-12 text-center text-txt-tertiary text-sm">No launches yet. Be the first to launch!</div>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              {launches.map((l, i) => <LaunchCard key={l.id} listing={l} rank={i + 1} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
