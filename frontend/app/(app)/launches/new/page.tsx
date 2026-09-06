'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { MARKET_CATEGORIES } from '@/lib/constants';
import { PlusIcon, TrashIcon, UploadIcon } from '@/components/icons';

export default function NewLaunchPage() {
  const router = useRouter();
  const showToast = useBoard((s) => s.showToast);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const addTech = () => {
    const t = techInput.trim();
    if (t && !techStack.includes(t) && techStack.length < 12) {
      setTechStack([...techStack, t]);
      setTechInput('');
    }
  };

  const removeTech = (t: string) => setTechStack(techStack.filter((x) => x !== t));

  const handleSubmit = async () => {
    if (!title.trim() || title.trim().length < 3) { showToast('Title must be at least 3 characters'); return; }
    if (!category) { showToast('Please select a category'); return; }
    if (!description.trim() || description.trim().length < 10) { showToast('Description must be at least 10 characters'); return; }

    setSubmitting(true);
    try {
      const listing = await api.createListing({
        kind: 'SHOWCASE', title, category, description, techStack, previewUrl, thumbnailUrl, deliveryUrl,
      });
      showToast('Launch published!');
      router.push(`/launches/${listing.id}`);
    } catch (e: any) {
      showToast(e.message || 'Failed to publish');
    }
    setSubmitting(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="page-container py-4 max-w-lg mx-auto space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-txt-primary">New Launch 🚀</h1>
            <p className="text-sm text-txt-secondary mt-1">Showcase your project to the community. No price needed — just share what you built.</p>
          </div>

          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="My Awesome Project" />
          </div>

          {/* Category */}
          <div>
            <label className="label">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              <option value="">Select category...</option>
              {MARKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[120px] resize-none" placeholder="Tell people what you built and why it's cool..." />
          </div>

          {/* Tech Stack */}
          <div>
            <label className="label">Tech Stack</label>
            <div className="flex gap-2">
              <input value={techInput} onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                className="input-field flex-1" placeholder="e.g. React, Node.js" />
              <button type="button" onClick={addTech} className="btn-primary px-3">
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {techStack.map((t) => (
                  <span key={t} className="badge-neutral flex items-center gap-1">
                    {t}
                    <button onClick={() => removeTech(t)} className="ml-0.5 hover:text-danger-500">
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Thumbnail */}
          <div>
            <label className="label">Thumbnail Image</label>
            <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Negotia'}
              onUpload={(result: any) => { setThumbnailUrl(result.info?.secure_url ?? ''); showToast('Image uploaded'); }}>
              {({ open }) => (
                <button type="button" onClick={() => open()} className="w-full py-8 border-2 border-dashed border-border-subtle rounded-xl text-txt-tertiary text-sm hover:border-accent-300 transition-colors flex items-center justify-center gap-2">
                  <UploadIcon className="w-5 h-5" />
                  {thumbnailUrl ? 'Change Image' : 'Upload Thumbnail'}
                </button>
              )}
            </CldUploadWidget>
            {thumbnailUrl && (
              <div className="mt-2 relative rounded-xl overflow-hidden h-32">
                <img src={thumbnailUrl} alt="" className="w-full h-full object-cover" />
                <button onClick={() => setThumbnailUrl('')} className="absolute top-2 right-2 p-1 rounded-full bg-surface/80 hover:bg-surface">
                  <TrashIcon className="w-4 h-4 text-danger-500" />
                </button>
              </div>
            )}
          </div>

          {/* Preview URL */}
          <div>
            <label className="label">Preview / Live URL</label>
            <input value={previewUrl} onChange={(e) => setPreviewUrl(e.target.value)} className="input-field" placeholder="https://..." />
          </div>

          {/* Delivery URL (source code / download) */}
          <div>
            <label className="label">Source / Download Link</label>
            <input value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} className="input-field" placeholder="https://github.com/..." />
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-3 text-base font-semibold mt-4">
            {submitting ? 'Publishing...' : '🚀 Publish Launch'}
          </button>
        </div>
      </div>
    </div>
  );
}
