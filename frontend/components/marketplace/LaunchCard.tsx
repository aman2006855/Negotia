'use client';

import Link from 'next/link';
import { StarRating } from './StarRating';
import { TechBadges } from './TechBadges';
import type { MarketListing } from '@/lib/types';

export function LaunchCard({ listing, rank }: { listing: MarketListing; rank?: number }) {
  return (
    <Link href={`/launches/${listing.id}`} className="card p-4 flex gap-4 items-start hover:shadow-lg transition-shadow">
      {/* Rank number */}
      {rank != null && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-accent-50 flex items-center justify-center">
          <span className="text-sm font-bold text-accent-600">{rank}</span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="shrink-0 w-14 h-14 rounded-xl bg-bg-secondary overflow-hidden">
        {listing.thumbnailUrl ? (
          <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg font-bold text-txt-tertiary/30">
            {listing.title.slice(0, 2)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-txt-primary truncate">{listing.title}</h3>
        <p className="text-xs text-txt-secondary line-clamp-1 mt-0.5">{listing.description}</p>
        <div className="flex items-center gap-3 mt-2">
          {listing.ratingCount > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={listing.avgRating} size="sm" />
              <span className="text-[11px] text-txt-secondary font-medium">{listing.avgRating.toFixed(1)}</span>
              <span className="text-[10px] text-txt-tertiary">({listing.ratingCount})</span>
            </div>
          )}
          {listing.pricingModel === 'FREE' && (
            <span className="text-[10px] font-semibold text-success-600 bg-success-50 px-2 py-0.5 rounded-full">Free</span>
          )}
        </div>
        <TechBadges techs={listing.techStack} max={3} />
      </div>
    </Link>
  );
}
