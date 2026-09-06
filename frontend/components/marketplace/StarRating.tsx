'use client';

export function StarRating({ rating, max = 5, size = 'md', interactive = false, onChange }: {
  rating: number; max?: number; size?: 'sm' | 'md' | 'lg'; interactive?: boolean; onChange?: (r: number) => void;
}) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4.5 h-4.5';
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && onChange?.(i + 1)}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
          >
            <svg className={sz} viewBox="0 0 20 20" fill="none">
              <path
                d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.26 5.06 16.7l.94-5.49-4-3.9 5.53-.8L10 1.5z"
                fill={filled ? 'hsl(45,93%,47%)' : half ? 'hsl(45,93%,47%)' : 'hsl(var(--color-border-subtle))'}
                opacity={filled || half ? 1 : 0.4}
              />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
