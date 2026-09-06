'use client';

import { useState } from 'react';
import { StarRating } from './StarRating';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';

export function RatingWidget({ listingId, onRated }: { listingId: string; onRated?: () => void }) {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const showToast = useBoard((s) => s.showToast);

  const handleSubmit = async () => {
    if (rating === 0) { showToast('Please select a star rating'); return; }
    setSubmitting(true);
    try {
      await api.rateLaunch(listingId, rating, review.trim() || undefined);
      showToast('Rating submitted!');
      setRating(0);
      setReview('');
      onRated?.();
    } catch (e: any) {
      showToast(e.message || 'Failed to submit rating');
    }
    setSubmitting(false);
  };

  return (
    <div className="card p-4 space-y-3">
      <h4 className="text-sm font-semibold text-txt-primary">Rate this launch</h4>
      <div className="flex items-center gap-3">
        <StarRating rating={rating} interactive onChange={setRating} size="lg" />
        {rating > 0 && <span className="text-sm font-medium text-txt-secondary">{rating}/5</span>}
      </div>
      <textarea
        value={review}
        onChange={(e) => setReview(e.target.value)}
        placeholder="Write a review (optional)..."
        className="input-field min-h-[60px] resize-none"
        maxLength={2000}
      />
      <button onClick={handleSubmit} disabled={submitting || rating === 0} className="btn-primary w-full">
        {submitting ? 'Submitting...' : 'Submit Rating'}
      </button>
    </div>
  );
}
