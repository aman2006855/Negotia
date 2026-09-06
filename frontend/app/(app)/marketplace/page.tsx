'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { MarketCard } from '@/components/marketplace/MarketCard';
import { MarketplaceTabs } from '@/components/marketplace/MarketplaceTabs';
import { MARKET_CATEGORIES } from '@/lib/constants';
import { SearchIcon } from '@/components/icons';
import type { MarketListing } from '@/lib/types';

const CATEGORIES = ['All', ...MARKET_CATEGORIES] as const;

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'budget-high' | 'popular'>('newest');

  useEffect(() => {
    (async () => {
      try {
        const all = await api.marketFeed('SALE', { category: activeCategory, sort: sortBy, query });
        setListings(all);
      } catch {}
      setLoading(false);
    })();
  }, [activeCategory, sortBy, query]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <MarketplaceTabs />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="page-container py-4">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-txt-primary tracking-tight">Marketplace</h1>
            <p className="text-sm text-txt-secondary mt-1">Buy digital products from verified sellers.</p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-tertiary" />
            <input
              type="text"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 mb-4">
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="input-field w-auto text-xs py-1.5">
              <option value="newest">Newest</option>
              <option value="budget-high">Price: High → Low</option>
              <option value="popular">Most Popular</option>
            </select>
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

          {/* Listings grid */}
          {loading ? (
            <div className="py-12 text-center text-txt-tertiary text-sm">Loading...</div>
          ) : listings.length === 0 ? (
            <div className="py-12 text-center text-txt-tertiary text-sm">No products found.</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mt-2">
              {listings.map((l) => <MarketCard key={l.id} listing={l} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
