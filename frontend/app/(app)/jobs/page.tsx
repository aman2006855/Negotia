'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { JobCard } from '@/components/JobCard';
import { FilterIcon } from '@/components/icons';
import { JobFilterSheet } from '@/components/JobFilterSheet';
import type { FeedJob } from '@/lib/types';

export default function JobsPage() {
  const jobs = useBoard((s) => s.jobs);
  const setJobs = useBoard((s) => s.setJobs);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'budget-high' | 'budget-low'>('newest');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const all = await api.feed();
        setJobs(all);
      } catch {}
      setLoading(false);
    })();
  }, [setJobs]);

  let filtered = [...jobs];
  if (selectedSkills.length > 0) {
    filtered = filtered.filter((j) =>
      selectedSkills.some((s) => j.description.toLowerCase().includes(s.toLowerCase()) || j.title.toLowerCase().includes(s.toLowerCase()))
    );
  }
  if (sortBy === 'budget-high') filtered.sort((a, b) => b.budgetCents - a.budgetCents);
  else if (sortBy === 'budget-low') filtered.sort((a, b) => a.budgetCents - b.budgetCents);
  else filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="page-container">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-txt-primary">Jobs</h1>
          <p className="text-xs text-txt-secondary">{filtered.length} available</p>
        </div>
        <button
          onClick={() => setShowFilter(true)}
          className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-medium text-txt-secondary hover:bg-inset hover:border-border-strong transition-all"
          aria-label="Filter and sort"
        >
          <FilterIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-sm font-medium text-txt-secondary">No jobs match your filters</p>
          <p className="mt-1 text-xs text-txt-tertiary">Try adjusting your search criteria</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((job) => <JobCard key={job.id} job={job} />)}
        </div>
      )}

      {showFilter && (
        <JobFilterSheet
          sortBy={sortBy}
          onSortChange={setSortBy}
          selectedSkills={selectedSkills}
          onToggleSkill={(s) => setSelectedSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])}
          onClear={() => { setSelectedSkills([]); setSortBy('newest'); }}
          onClose={() => setShowFilter(false)}
        />
      )}
    </div>
  );
}
