'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { JobCard } from '@/components/JobCard';
import { FilterIcon } from '@/components/icons';
import { JobFilterSheet } from '@/components/JobFilterSheet';
import type { FeedJob } from '@/lib/types';

const CATEGORIES = ['All', 'Web & App', 'UI/UX Design', 'Video Editing', 'Data Entry', 'Writing', 'Marketing'];

export default function JobsPage() {
  const jobs = useBoard((s) => s.jobs);
  const setJobs = useBoard((s) => s.setJobs);
  const user = useBoard((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'budget-high' | 'budget-low'>('newest');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Category filter
  if (activeCategory !== 'All') {
    filtered = filtered.filter((j) => j.category === activeCategory);
  }

  // Skill filter
  if (selectedSkills.length > 0) {
    filtered = filtered.filter((j) =>
      selectedSkills.some((s) => j.description.toLowerCase().includes(s.toLowerCase()) || j.title.toLowerCase().includes(s.toLowerCase()))
    );
  }

  // Sort
  if (sortBy === 'budget-high') filtered.sort((a, b) => b.budgetCents - a.budgetCents);
  else if (sortBy === 'budget-low') filtered.sort((a, b) => a.budgetCents - b.budgetCents);
  else filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const firstName = (user?.fullName || user?.name || '').split(' ')[0] || 'there';

  return (
    <div className="page-container">
      {/* ─── Personalized Welcome Header ─── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-txt-primary tracking-tight">
          Welcome back, {firstName} 👋
        </h1>
        <p className="text-sm text-txt-secondary mt-1">Find your next great project.</p>
      </div>

      {/* ─── Category Chips ─── */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-2.5 pb-2 pt-1 whitespace-nowrap no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              activeCategory === cat
                ? 'bg-accent-600 text-white shadow-soft'
                : 'bg-inset text-txt-secondary hover:bg-border-subtle hover:text-txt-primary'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ─── Filter Bar ─── */}
      <div className="mt-4 mb-4 flex items-center justify-between">
        <p className="text-xs text-txt-tertiary">
          {filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} available
          {activeCategory !== 'All' && ` in ${activeCategory}`}
        </p>
        <button
          onClick={() => setShowFilter(true)}
          className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface px-3 py-2 text-sm font-medium text-txt-secondary hover:bg-inset hover:border-border-strong transition-all"
          aria-label="Filter and sort"
        >
          <FilterIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Filter</span>
        </button>
      </div>

      {/* ─── Job List ─── */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-inset mb-4">
            <svg className="h-8 w-8 text-txt-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-txt-primary mb-1">No jobs found</p>
          <p className="text-xs text-txt-tertiary max-w-[240px]">
            {activeCategory !== 'All'
              ? `No jobs in "${activeCategory}" yet. Try a different category or check back later.`
              : 'No jobs match your filters. Try adjusting your search criteria.'}
          </p>
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
