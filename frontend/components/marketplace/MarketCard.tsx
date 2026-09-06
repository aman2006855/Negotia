'use client';

import Link from 'next/link';
import { TechBadges } from './TechBadges';
import { StarRating } from './StarRating';
import { formatBudget } from '@/lib/constants';
import { ExternalLinkIcon } from '../icons';
import type { MarketListing } from '@/lib/types';

export function MarketCard({ listing }: { listing: MarketListing }) {
  const isSale = listing.kind === 'SALE';
  return (
    <Link href={`/marketplace/${listing.id}`} className="card p-0 flex flex-col hover:shadow-lg transition-shadow">
      {/* Thumbnail */}
      <div className="relative h-36 bg-bg-secondary overflow-hidden rounded-t-2xl">
        {listing.thumbnailUrl ? (
          <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-txt-tertiary/30">
            {listing.title.slice(0, 2)}
          </div>
        )}
        {/* Price badge */}
        <div className="absolute top-2 right-2">
          {isSale && listing.priceCents != null ? (
            <span className="bg-accent-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              {formatBudget(listing.priceCents, listing.currency)}
            </span>
          ) : (
            <span className="bg-success-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
              Free
            </span>
          )}
        </div>
        {/* Kind badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-surface/90 backdrop-blur text-txt-primary text-[10px] font-semibold px-2 py-0.5 rounded-full border border-border-subtle">
            {isSale ? '🛒 For Sale' : '🚀 Showcase'}
          </span>
        </div>
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-semibold text-txt-primary truncate">{listing.title}</h3>
        <p className="text-xs text-txt-secondary line-clamp-2 break-words">{listing.description}</p>
        <TechBadges techs={listing.techStack} max={4} />

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {listing.sellerAvatar ? (
              <img src={listing.sellerAvatar} alt="" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-accent-100 flex items-center justify-center text-[9px] font-bold text-accent-600">
                {(listing.sellerName ?? 'S')[0]}
              </div>
            )}
            <span className="text-[11px] text-txt-secondary truncate max-w-[80px]">{listing.sellerName}</span>
          </div>
          {listing.ratingCount > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={listing.avgRating} size="sm" />
              <span className="text-[10px] text-txt-tertiary">({listing.ratingCount})</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
