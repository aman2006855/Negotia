'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { TechBadges } from '@/components/marketplace/TechBadges';
import { StarRating } from '@/components/marketplace/StarRating';
import { RatingWidget } from '@/components/marketplace/RatingWidget';
import { ArrowLeftIcon, ExternalLinkIcon, CartIcon, ShareIcon } from '@/components/icons';
import type { MarketListing, LaunchRating } from '@/lib/types';

export default function LaunchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [listing, setListing] = useState<MarketListing | null>(null);
  const [ratings, setRatings] = useState<LaunchRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [deliveryUrl, setDeliveryUrl] = useState<string | null>(null);
  const user = useBoard((s) => s.user);
  const showToast = useBoard((s) => s.showToast);

  const loadData = async () => {
    try {
      const l = await api.getListing(id);
      setListing(l);
      const r = await api.getRatings(id);
      setRatings(r);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const handlePurchase = async () => {
    if (!listing) return;
    setPurchasing(true);
    try {
      const { deliveryUrl: url } = await api.purchaseListing(listing.id);
      setDeliveryUrl(url);
      showToast('Access granted!');
    } catch (e: any) {
      showToast(e.message || 'Failed to get access');
    }
    setPurchasing(false);
  };

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: listing?.title ?? 'Check this out', url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        showToast('Link copied to clipboard!');
      } catch {
        showToast('Failed to copy link');
      }
    }
  };

  if (loading) return <div className="page-container py-12 text-center text-txt-tertiary text-sm">Loading...</div>;
  if (!listing) return <div className="page-container py-12 text-center text-txt-tertiary text-sm">Launch not found.</div>;

  const isOwner = user?.id === listing.sellerId;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="shrink-0 px-4 py-3 border-b border-border-subtle bg-surface flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-bg-secondary">
          <ArrowLeftIcon className="w-5 h-5 text-txt-secondary" />
        </button>
        <h2 className="text-base font-semibold text-txt-primary truncate flex-1">{listing.title}</h2>
        <button onClick={handleShare}
          className="p-1.5 rounded-lg hover:bg-bg-secondary text-txt-secondary hover:text-accent-500 transition-colors shrink-0"
          aria-label="Share launch">
          <ShareIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="page-container py-4 max-w-lg mx-auto space-y-4">
          {/* Thumbnail */}
          {listing.thumbnailUrl && (
            <div className="rounded-2xl overflow-hidden bg-bg-secondary h-48">
              <img src={listing.thumbnailUrl} alt={listing.title} className="w-full h-full object-cover" />
            </div>
          )}

          {/* Title + Rating */}
          <div>
            <h1 className="text-xl font-bold text-txt-primary">{listing.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              {listing.ratingCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <StarRating rating={listing.avgRating} size="md" />
                  <span className="text-sm font-medium text-txt-primary">{listing.avgRating.toFixed(1)}</span>
                  <span className="text-xs text-txt-tertiary">({listing.ratingCount})</span>
                </div>
              )}
              <span className="text-xs text-txt-tertiary">{listing.category}</span>
            </div>
          </div>

          {/* Tech Stack */}
          <TechBadges techs={listing.techStack} />

          {/* Description */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-txt-primary mb-2">About this launch</h3>
            <p className="text-sm text-txt-secondary leading-relaxed whitespace-pre-wrap break-words">{listing.description}</p>
          </div>

          {/* Preview */}
          {listing.previewUrl && (
            <a href={listing.previewUrl} target="_blank" rel="noopener noreferrer" className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
              <ExternalLinkIcon className="w-5 h-5 text-accent-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-txt-primary">View Live Preview</p>
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

          {/* Delivery reveal */}
          {(isOwner || deliveryUrl) && (
            <div className="card p-4 border-success-200 bg-success-50/50">
              <h4 className="text-sm font-semibold text-txt-primary mb-1">🔗 Source / Download</h4>
              <a href={isOwner ? listing.deliveryUrl ?? undefined : deliveryUrl ?? undefined} target="_blank" rel="noopener noreferrer"
                className="text-sm text-accent-500 underline break-all">
                {isOwner ? listing.deliveryUrl : deliveryUrl}
              </a>
            </div>
          )}

          {/* CTA */}
          {listing.pricingModel === 'FREE' && !isOwner && !deliveryUrl && (
            <button onClick={handlePurchase} disabled={purchasing} className="btn-primary w-full py-3 text-base font-semibold">
              <CartIcon className="w-5 h-5 inline mr-2" />
              {purchasing ? 'Processing...' : 'Get Access (Free)'}
            </button>
          )}

          {/* Rating widget */}
          {!isOwner && <RatingWidget listingId={listing.id} onRated={loadData} />}

          {/* Reviews list */}
          {ratings.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-txt-primary">Reviews ({ratings.length})</h3>
              {ratings.map((r) => (
                <div key={r.id} className="card p-3 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <StarRating rating={r.rating} size="sm" />
                    <span className="text-xs font-medium text-txt-primary">{r.raterName}</span>
                    <span className="text-[10px] text-txt-tertiary ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  {r.review && <p className="text-xs text-txt-secondary leading-relaxed">{r.review}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
