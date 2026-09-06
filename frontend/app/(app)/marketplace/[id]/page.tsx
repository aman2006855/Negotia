'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { TechBadges } from '@/components/marketplace/TechBadges';
import { StarRating } from '@/components/marketplace/StarRating';
import { formatBudget } from '@/lib/constants';
import { ArrowLeftIcon, ExternalLinkIcon, CartIcon } from '@/components/icons';
import type { MarketListing, LaunchRating } from '@/lib/types';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<MarketListing | null>(null);
  const [ratings, setRatings] = useState<LaunchRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [deliveryUrl, setDeliveryUrl] = useState<string | null>(null);
  const user = useBoard((s) => s.user);
  const showToast = useBoard((s) => s.showToast);

  useEffect(() => {
    (async () => {
      try {
        const l = await api.getListing(id);
        setListing(l);
        if (l.kind === 'SHOWCASE') {
          const r = await api.getRatings(id);
          setRatings(r);
        }
      } catch {}
      setLoading(false);
    })();
  }, [id]);

  const handlePurchase = async () => {
    if (!listing) return;
    setPurchasing(true);
    try {
      const { deliveryUrl: url } = await api.purchaseListing(listing.id);
      setDeliveryUrl(url);
      showToast('Access granted! Check the delivery link below.');
    } catch (e: any) {
      showToast(e.message || 'Failed to get access');
    }
    setPurchasing(false);
  };

  if (loading) return <div className="page-container py-12 text-center text-txt-tertiary text-sm">Loading...</div>;
  if (!listing) return <div className="page-container py-12 text-center text-txt-tertiary text-sm">Listing not found.</div>;

  const isSale = listing.kind === 'SALE';
  const isOwner = user?.id === listing.sellerId;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 border-b border-border-subtle bg-surface flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-bg-secondary">
          <ArrowLeftIcon className="w-5 h-5 text-txt-secondary" />
        </button>
        <h2 className="text-base font-semibold text-txt-primary truncate">{listing.title}</h2>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="page-container py-4 max-w-lg mx-auto space-y-4">
          {/* Thumbnail */}
          {listing.thumbnailUrl && (
            <div className="rounded-2xl overflow-hidden bg-bg-secondary h-48">
              <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title + Price */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold text-txt-primary">{listing.title}</h1>
              {isSale && listing.priceCents != null ? (
                <span className="shrink-0 bg-accent-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {formatBudget(listing.priceCents, listing.currency)}
                </span>
              ) : (
                <span className="shrink-0 bg-success-500 text-white text-sm font-bold px-3 py-1 rounded-full">Free</span>
              )}
            </div>
            <p className="text-xs text-txt-tertiary mt-1">{listing.category} · {isSale ? 'For Sale' : 'Showcase'}</p>
          </div>

          {/* Rating */}
          {listing.ratingCount > 0 && (
            <div className="flex items-center gap-2">
              <StarRating rating={listing.avgRating} size="md" />
              <span className="text-sm font-medium text-txt-primary">{listing.avgRating.toFixed(1)}</span>
              <span className="text-xs text-txt-tertiary">({listing.ratingCount} ratings)</span>
              <span className="text-xs text-txt-tertiary ml-2">· {listing.purchaseCount} purchases</span>
            </div>
          )}

          {/* Tech Stack */}
          <TechBadges techs={listing.techStack} />

          {/* Description */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-txt-primary mb-2">Description</h3>
            <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-wrap break-words">{listing.description}</p>
          </div>

          {/* Preview */}
          {listing.previewUrl && (
            <a href={listing.previewUrl} target="_blank" rel="noopener noreferrer" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <ExternalLinkIcon className="w-5 h-5 text-accent-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-txt-primary">View Preview</p>
                <p className="text-xs text-txt-tertiary truncate">{listing.previewUrl}</p>
              </div>
            </a>
          )}

          {/* Seller */}
          <div className="card p-4 flex items-center gap-3">
            {listing.sellerAvatar ? (
              <img src={listing.sellerAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-accent-100 flex items-center justify-center text-sm font-bold text-accent-600">
                {(listing.sellerName ?? 'S')[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-txt-primary">{listing.sellerName}</p>
              {listing.sellerUsername && <p className="text-xs text-txt-tertiary">@{listing.sellerUsername}</p>}
            </div>
          </div>

          {/* Delivery URL reveal (owner or after purchase) */}
          {(isOwner || deliveryUrl) && (
            <div className="card p-4 border-success-200 bg-success-50/50">
              <h4 className="text-sm font-semibold text-txt-primary mb-1">🔗 Delivery Link</h4>
              <a href={isOwner ? listing.deliveryUrl ?? undefined : deliveryUrl ?? undefined} target="_blank" rel="noopener noreferrer"
                className="text-sm text-accent-500 underline break-all">
                {isOwner ? listing.deliveryUrl : deliveryUrl}
              </a>
            </div>
          )}

          {/* Purchase CTA */}
          {isSale && !isOwner && !deliveryUrl && (
            <button onClick={handlePurchase} disabled={purchasing} className="btn-primary w-full py-3 text-base font-semibold">
              <CartIcon className="w-5 h-5 inline mr-2" />
              {purchasing ? 'Processing...' : `Get Access · ${formatBudget(listing.priceCents ?? 0, listing.currency)}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
