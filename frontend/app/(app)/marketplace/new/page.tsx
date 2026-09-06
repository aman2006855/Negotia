'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { createListingSchema } from '@/lib/validations/marketplace';
import { MARKET_CATEGORIES } from '@/lib/constants';
import { PlusIcon, TrashIcon, UploadIcon } from '@/components/icons';

export default function NewListingPage() {
  const router = useRouter();
  const showToast = useBoard((s) => s.showToast);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [techInput, setTechInput] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [pricingModel, setPricingModel] = useState<'FIXED' | 'SUBSCRIPTION'>('FIXED');
  const [deliveryUrl, setDeliveryUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setErrors({});
    const parsed = createListingSchema.safeParse({
      kind: 'SALE', title, category, description, techStack, previewUrl, thumbnailUrl,
      priceCents: Math.round(parseFloat(priceCents || '0') * 100),
      currency, pricingModel, deliveryUrl,
    });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path.join('.')] = i.message; });
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    try {
      const listing = await api.createListing({
        kind: 'SALE', title, category, description, techStack, previewUrl, thumbnailUrl,
        priceCents: Math.round(parseFloat(priceCents || '0') * 100),
        currency, pricingModel, deliveryUrl,
      });
      showToast('Listing published!');
      router.push(`/marketplace/${listing.id}`);
    } catch (e: any) {
      showToast(e.message || 'Failed to create listing');
    }
    setSubmitting(false);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="page-container py-4 max-w-lg mx-auto space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-txt-primary">Launch a Product</h1>
            <p className="text-sm text-txt-secondary mt-1">List your digital product for sale on the marketplace.</p>
          </div>

          {/* Title */}
          <div>
            <label className="label">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="My Awesome Product" />
            {errors.title && <p className="error-text">{errors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="label">Category *</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
              <option value="">Select category...</option>
              {MARKET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="error-text">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="label">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[120px] resize-none" placeholder="Tell people what this is..." />
            {errors.description && <p className="error-text">{errors.description}</p>}
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

          {/* Thumbnail upload */}
          <div>
            <label className="label">Thumbnail Image</label>
            <CldUploadWidget uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Negotia'}
              options={{ maxFiles: 1, resourceType: 'image' }}
              onSuccess={(result: any) => {
                const info = result?.info;
                if (info?.secure_url) {
                  setThumbnailUrl(info.secure_url);
                  showToast('Image uploaded');
                }
              }}>
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
            {errors.previewUrl && <p className="error-text">{errors.previewUrl}</p>}
          </div>

          {/* Price */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="label">Price *</label>
              <input type="number" value={priceCents} onChange={(e) => setPriceCents(e.target.value)}
                className="input-field" placeholder="0.00" step="0.01" min="1" />
              {errors.priceCents && <p className="error-text">{errors.priceCents}</p>}
            </div>
            <div className="w-28">
              <label className="label">Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value as any)} className="input-field">
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
            <div className="w-32">
              <label className="label">Model</label>
              <select value={pricingModel} onChange={(e) => setPricingModel(e.target.value as any)} className="input-field">
                <option value="FIXED">One-time</option>
                <option value="SUBSCRIPTION">Subscription</option>
              </select>
            </div>
          </div>

          {/* Delivery URL */}
          <div>
            <label className="label">Delivery Link (repo / download) *</label>
            <input value={deliveryUrl} onChange={(e) => setDeliveryUrl(e.target.value)} className="input-field" placeholder="https://github.com/..." />
            {errors.deliveryUrl && <p className="error-text">{errors.deliveryUrl}</p>}
          </div>

          <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full py-3 text-base font-semibold mt-4">
            {submitting ? 'Publishing...' : '🚀 Publish Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}
