'use client';

import { XIcon } from './icons';
import { SKILL_OPTIONS } from '@/lib/mock';

interface JobFilterSheetProps {
  sortBy: 'newest' | 'budget-high' | 'budget-low';
  onSortChange: (s: 'newest' | 'budget-high' | 'budget-low') => void;
  selectedSkills: string[];
  onToggleSkill: (skill: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function JobFilterSheet({ sortBy, onSortChange, selectedSkills, onToggleSkill, onClear, onClose }: JobFilterSheetProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-surface border border-border-subtle shadow-strong animate-slide-up sm:rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold text-txt-primary">Filter & Sort</h2>
          <div className="flex items-center gap-2">
            <button onClick={onClear} className="text-xs font-medium text-accent-600 hover:text-accent-700">Clear all</button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-txt-tertiary hover:bg-inset hover:text-txt-primary transition-colors">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto px-4 py-4 space-y-5">
          <div>
            <p className="text-xs font-semibold text-txt-secondary mb-2 uppercase tracking-wider">Sort by</p>
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'newest', label: 'Newest' },
                { key: 'budget-high', label: 'Budget High' },
                { key: 'budget-low', label: 'Budget Low' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => onSortChange(opt.key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    sortBy === opt.key
                      ? 'bg-accent-600 text-white shadow-soft'
                      : 'border border-border-subtle bg-surface text-txt-secondary hover:bg-inset hover:border-border-strong'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-txt-secondary mb-2 uppercase tracking-wider">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {SKILL_OPTIONS.slice(0, 20).map((skill) => (
                <button
                  key={skill}
                  onClick={() => onToggleSkill(skill)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedSkills.includes(skill)
                      ? 'bg-accent-600 text-white'
                      : 'border border-border-subtle bg-surface text-txt-secondary hover:bg-inset hover:border-border-strong'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
