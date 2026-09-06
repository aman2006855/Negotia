'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { MarketCard } from '@/components/marketplace/MarketCard';
import { MarketplaceTabs } from '@/components/marketplace/MarketplaceTabs';
import { StarRating } from '@/components/marketplace/StarRating';
import { formatBudget } from '@/lib/constants';
import type { MarketListing, SellerStats } from '@/lib/types';

type StoreTab = 'listings' | 'purchases' | 'revenue';

export default function MyStorePage() {
  const [tab, setTab] = useState<StoreTab>('listings');
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [purchases, setPurchases] = useState<MarketListing[]>([]);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useBoard((s) => s.user);

  useEffect(() => {
    (async () => {
      try {
        const [l, p, s] = await Promise.all([api.myListings(), api.myPurchases(), api.sellerStats()]);
        setListings(l);
        setPurchases(p);
        setStats(s);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <div className="h-full flex flex-col overflow-hidden">
      <MarketplaceTabs />
      <div className="flex-1 flex items-center justify-center text-txt-tertiary text-sm">Loading...</div>
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <MarketplaceTabs />
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="page-container py-4 max-w-lg mx-auto space-y-4">
          {/* Header */}
          <div className="mb-2">
            <h1 className="text-2xl font-bold text-txt-primary tracking-tight">My Store</h1>
            <p className="text-sm text-txt-secondary mt-1">{user?.name ?? 'Your'} marketplace profile</p>
          </div>

          {/* Stats cards */}
          {stats && (
            <div className="grid grid-cols-2 gap-3">
              <div className="stat-card">
                <span className="text-2xl font-bold text-txt-primary">{stats.totalListings}</span>
                <span className="text-xs text-txt-secondary">Total Listings</span>
              </div>
              <div className="stat-card">
                <span className="text-2xl font-bold text-txt-primary">{stats.totalPurchases}</span>
                <span className="text-xs text-txt-secondary">Total Sales</span>
              </div>
              <div className="stat-card">
                <span className="text-2xl font-bold text-txt-primary">{formatBudget(stats.totalRevenueCents)}</span>
                <span className="text-xs text-txt-secondary">Revenue</span>
              </div>
              <div className="stat-card">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={stats.avgRating} size="sm" />
                  <span className="text-sm font-bold text-txt-primary">{stats.avgRating.toFixed(1)}</span>
                </div>
                <span className="text-xs text-txt-secondary">{stats.ratingCount} ratings</span>
              </div>
            </div>
          )}

          {/* Tab bar */}
          <div className="flex gap-1 bg-bg-secondary rounded-xl p-1">
            {(['listings', 'purchases', 'revenue'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
                  tab === t ? 'bg-surface text-txt-primary shadow-sm' : 'text-txt-secondary'
                }`}>
                {t === 'listings' ? 'My Listings' : t === 'purchases' ? 'My Purchases' : 'Revenue'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'listings' && (
            listings.length === 0 ? (
              <div className="py-8 text-center text-txt-tertiary text-sm">No listings yet. Create one from the Add tab!</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {listings.map((l) => <MarketCard key={l.id} listing={l} />)}
              </div>
            )
          )}

          {tab === 'purchases' && (
            purchases.length === 0 ? (
              <div className="py-8 text-center text-txt-tertiary text-sm">No purchases yet. Browse the Store tab!</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {purchases.map((l) => <MarketCard key={l.id} listing={l} />)}
              </div>
            )
          )}

          {tab === 'revenue' && stats && (
            <div className="space-y-3">
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-txt-primary mb-3">Revenue Breakdown</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Sale Listings</span>
                    <span className="font-medium text-txt-primary">{stats.saleListings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Showcase Listings</span>
                    <span className="font-medium text-txt-primary">{stats.showcaseListings}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-txt-secondary">Total Purchases</span>
                    <span className="font-medium text-txt-primary">{stats.totalPurchases}</span>
                  </div>
                  <div className="border-t border-border-subtle pt-2 mt-2 flex justify-between text-base">
                    <span className="font-semibold text-txt-primary">Total Revenue</span>
                    <span className="font-bold text-accent-600">{formatBudget(stats.totalRevenueCents)}</span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-txt-tertiary text-center">Payment is settled directly between buyer and seller.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
