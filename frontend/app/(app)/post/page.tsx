'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { BriefcaseIcon } from '@/components/icons';
import { JOB_CATEGORIES } from '@/lib/constants';
import { CustomSelect } from '@/components/CustomSelect';

export default function PostPage() {
  const router = useRouter();
  const showToast = useBoard((s) => s.showToast);
  const [form, setForm] = useState({ title: '', description: '', budgetCents: '', agreementText: '', category: '', currency: 'USD' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.category) {
      setError('Please select a category');
      return;
    }
    setLoading(true);
    try {
      await api.createJob({
        title: form.title,
        description: form.description,
        budgetCents: Math.round(parseFloat(form.budgetCents) * 100),
        agreementText: form.agreementText,
        category: form.category,
        currency: form.currency,
      });
      showToast('Job posted successfully');
      router.push('/my-postings');
    } catch (err: any) {
      setError(err.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-24 max-w-2xl mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
          <BriefcaseIcon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-txt-primary">Post a New Job</h1>
          <p className="text-sm text-txt-secondary">Fill in the details below. The agreement text is mandatory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border-subtle bg-surface p-6 shadow-soft">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-txt-primary">Job Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Build a REST API for a booking system"
            required
            minLength={4}
            maxLength={120}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-txt-primary">Category <span className="text-danger-500">*</span></label>
          <CustomSelect
            value={form.category}
            onChange={(val) => setForm({ ...form, category: val })}
            options={JOB_CATEGORIES.map((c) => ({ value: c, label: c }))}
            placeholder="Select a category..."
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-txt-primary">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the project scope, requirements, and deliverables…"
            required
            minLength={10}
            maxLength={4000}
            rows={5}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm resize-y"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-txt-primary">Budget</label>
          <div className="flex gap-2">
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="w-24 rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
            </select>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-txt-tertiary">
                {form.currency === 'INR' ? '₹' : '$'}
              </span>
              <input
                type="number"
                value={form.budgetCents}
                onChange={(e) => setForm({ ...form, budgetCents: e.target.value })}
                placeholder="0"
                required
                min={1}
                max={form.currency === 'INR' ? 50000000 : 500000}
                step={0.01}
                className="w-full rounded-lg border border-border-subtle bg-surface pl-7 pr-3.5 py-2.5 text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-txt-primary">
            Agreement Text <span className="text-danger-500">*</span>
          </label>
          <p className="mb-2 text-xs text-txt-tertiary">
            This text will be shown to the freelancer when they accept. They must sign it to close the deal.
          </p>
          <textarea
            value={form.agreementText}
            onChange={(e) => setForm({ ...form, agreementText: e.target.value })}
            placeholder="Payment on delivery. 2 revisions included. NDA required. Timeline: 14 days…"
            required
            minLength={20}
            maxLength={12000}
            rows={6}
            className="w-full rounded-lg border border-border-subtle bg-surface px-3.5 py-2.5 text-sm resize-y"
          />
        </div>

        {error && <p className="text-sm text-danger-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent-600 py-2.5 text-sm font-medium text-white transition hover:bg-accent-700 disabled:opacity-50"
        >
          {loading ? 'Posting…' : 'Post Job'}
        </button>
      </form>
    </div>
  );
}
