'use client';

import { useState } from 'react';
import { StarIcon, XIcon } from '@/components/icons';
import type { Project } from '@/lib/types';

interface ReviewModalProps {
  project: Project;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export function ReviewModal({ project, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (rating === 0 || !comment.trim()) return;
    setLoading(true);
    try {
      await onSubmit(rating, comment.trim());
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-txt-primary/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-surface shadow-strong border border-border-subtle animate-scale-in">
        <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
          <div>
            <h3 className="text-base font-semibold text-txt-primary">Leave a Review</h3>
            <p className="text-xs text-txt-secondary mt-0.5">{project.title}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-txt-tertiary hover:bg-inset hover:text-txt-primary transition">
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="label">Rating</label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="p-0.5 transition-transform hover:scale-110"
                >
                  <StarIcon
                    className="h-8 w-8 text-warning-500"
                    filled={star <= (hoveredRating || rating)}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-txt-secondary">
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Fair'}
                  {rating === 3 && 'Good'}
                  {rating === 4 && 'Very Good'}
                  {rating === 5 && 'Excellent'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="label">Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input-field resize-none"
              rows={4}
              placeholder="Share your experience working with this freelancer..."
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={loading || rating === 0 || !comment.trim()}
              className="btn-primary"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
