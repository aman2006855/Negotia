'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CldUploadWidget } from 'next-cloudinary';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { ArrowLeftIcon, CameraIcon } from '@/components/icons';
import type { SocialLinks } from '@/lib/types';

const DEFAULT_SOCIAL: SocialLinks = { instagram: '', twitter: '', github: '', whatsapp: '', linkedin: '' };

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string }[] = [
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/yourname' },
  { key: 'twitter', label: 'Twitter (X)', placeholder: 'https://x.com/yourname' },
  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/yourname' },
  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+1 234 567 8900' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/yourname' },
];

export default function EditProfilePage() {
  const router = useRouter();
  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const showToast = useBoard((s) => s.showToast);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [about, setAbout] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [coverPhotoUrl, setCoverPhotoUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({ ...DEFAULT_SOCIAL });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [usernameError, setUsernameError] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originalUsername = useRef('');

  useEffect(() => {
    (async () => {
      try {
        if (!user) {
          const me = await api.me();
          if (me.user) setUser(me.user);
        }
      } catch {}
      setLoading(false);
    })();
  }, [user, setUser]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || user.name || '');
      setUsername(user.username || '');
      setAbout(user.about || '');
      setAvatarUrl(user.avatar || '');
      setAvatarPreview(user.avatar || '');
      setCoverPhotoUrl(user.coverPhotoUrl || '');
      setCoverPreview(user.coverPhotoUrl || '');
      setSocialLinks({ ...DEFAULT_SOCIAL, ...(user.socialLinks || {}) });
      originalUsername.current = user.username || '';
    }
  }, [user]);

  const checkUsernameDebounced = useCallback((val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUsername(clean);
    setUsernameAvailable(null);
    setUsernameError('');

    if (clean === originalUsername.current) {
      setUsernameAvailable(true);
      setUsernameChecking(false);
      return;
    }
    if (clean.length < 3) { setUsernameChecking(false); return; }

    setUsernameChecking(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { available } = await api.checkUsername(clean);
        setUsernameAvailable(available);
        if (!available) setUsernameError('This username is already taken');
      } catch { setUsernameAvailable(null); }
      setUsernameChecking(false);
    }, 400);
  }, []);

  function handleAvatarUpload(result: any) {
    const info = result?.info;
    if (info?.secure_url) {
      setAvatarUrl(info.secure_url);
      setAvatarPreview(info.secure_url);
    }
  }

  function handleCoverUpload(result: any) {
    const info = result?.info;
    if (info?.secure_url) {
      setCoverPhotoUrl(info.secure_url);
      setCoverPreview(info.secure_url);
    }
  }

  function updateSocial(key: keyof SocialLinks, value: string) {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setError('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    if (usernameAvailable === false) {
      setError('Username is already taken');
      return;
    }

    setSaving(true);
    try {
      const cleanedSocial: SocialLinks = {};
      Object.entries(socialLinks).forEach(([k, v]) => {
        if (v && v.trim()) cleanedSocial[k as keyof SocialLinks] = v.trim();
      });

      const { user: updatedUser } = await api.updateProfile({
        fullName: fullName.trim(),
        username,
        about: about.trim() || undefined,
        avatar: avatarUrl || undefined,
        coverPhotoUrl: coverPhotoUrl || undefined,
        socialLinks: Object.keys(cleanedSocial).length > 0 ? cleanedSocial : undefined,
      } as any);
      if (updatedUser) setUser(updatedUser);
      showToast('Profile updated');
      router.push('/profile');
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  }

  const initials = (fullName || username || '?').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const coverHeight = 'h-40 sm:h-48';

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pb-32 max-w-lg mx-auto px-4 py-6">
      <button onClick={() => router.push('/profile')}
        className="flex items-center gap-1.5 text-sm text-txt-secondary hover:text-txt-primary transition-colors mb-6 -ml-1">
        <ArrowLeftIcon className="h-4 w-4" /> Back to profile
      </button>

      <h1 className="text-2xl font-bold text-txt-primary mb-1">Edit Profile</h1>
      <p className="text-sm text-txt-secondary mb-8">Update your public information</p>

      {error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-500/20 px-4 py-3 text-sm text-danger-600">
          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          {error}
        </div>
      )}

      {/* ─── Cover Photo + Avatar ─── */}
      <div className="card overflow-hidden mb-5">
        {/* Cover Photo */}
        <div className={`relative ${coverHeight} group`}>
          {coverPreview ? (
            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-accent-600 via-accent-500 to-blue-500" />
          )}
          {/* Always-visible edit button for mobile */}
          <div className="absolute top-3 right-3 z-10">
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Negotia'}
              options={{ maxFiles: 1, resourceType: 'image', cropping: true, croppingAspectRatio: 3 }}
              onSuccess={handleCoverUpload}
            >
              {({ open }) => (
                <button onClick={() => open()}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors shadow-lg">
                  <CameraIcon className="h-4 w-4" />
                </button>
              )}
            </CldUploadWidget>
          </div>
          {/* Center label when no cover */}
          {!coverPreview && (
            <div className="absolute inset-0 flex items-center justify-center">
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Negotia'}
                options={{ maxFiles: 1, resourceType: 'image', cropping: true, croppingAspectRatio: 3 }}
                onSuccess={handleCoverUpload}
              >
                {({ open }) => (
                  <button onClick={() => open()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 backdrop-blur border border-white/30 px-4 py-2 text-xs font-semibold text-white hover:bg-white/30 transition-colors">
                    <CameraIcon className="h-3.5 w-3.5" /> Add Cover Photo
                  </button>
                )}
              </CldUploadWidget>
            </div>
          )}
        </div>

        {/* Avatar (overlapping cover) */}
        <div className="relative px-6 -mt-10 pb-4">
          <div className="relative inline-block group">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar"
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover border-4 border-surface shadow-medium" />
            ) : (
              <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full border-4 border-surface bg-accent-100 text-2xl sm:text-3xl font-bold text-accent-700 shadow-medium">
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <CameraIcon className="h-5 w-5 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1">
              <CldUploadWidget
                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'Negotia'}
                options={{ maxFiles: 1, resourceType: 'image', cropping: true, croppingAspectRatio: 1 }}
                onSuccess={handleAvatarUpload}
              >
                {({ open }) => (
                  <button onClick={() => open()}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-600 text-white shadow-md hover:bg-accent-700 transition-colors border-2 border-surface">
                    <CameraIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </CldUploadWidget>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Form Fields ─── */}
      <div className="card p-6 sm:p-8 space-y-5">
        {/* Full Name */}
        <div>
          <label className="label">Full name</label>
          <input type="text" value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="input-field py-3" placeholder="e.g. Sarah Chen" />
        </div>

        {/* Username */}
        <div>
          <label className="label">Username</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-txt-tertiary text-sm font-medium">@</span>
            <input type="text" value={username}
              onChange={(e) => checkUsernameDebounced(e.target.value)}
              className={`input-field py-3 pl-8 pr-10 ${
                usernameAvailable === true ? 'border-success-500 focus:ring-success-500/30 focus:border-success-500' :
                usernameAvailable === false || usernameError ? 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500' : ''
              }`}
              placeholder="yourname" />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {usernameChecking && <div className="h-4 w-4 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />}
              {!usernameChecking && usernameAvailable === true && <svg className="h-4 w-4 text-success-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
              {!usernameChecking && usernameAvailable === false && <svg className="h-4 w-4 text-danger-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
            </div>
          </div>
          {usernameError && <p className="mt-1.5 text-xs text-danger-600">{usernameError}</p>}
          {usernameAvailable === true && <p className="mt-1.5 text-xs text-success-600 font-medium">@{username} is available!</p>}
        </div>

        {/* About */}
        <div>
          <label className="label">About <span className="text-txt-tertiary font-normal">(optional)</span></label>
          <textarea value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="input-field resize-none py-3" rows={4}
            placeholder="Tell others about yourself, your expertise, and what you're looking for..." />
          <p className="mt-1.5 text-xs text-txt-tertiary">{about.length}/500</p>
        </div>
      </div>

      {/* ─── Social Links ─── */}
      <div className="card p-6 sm:p-8 mt-5">
        <h2 className="text-sm font-semibold text-txt-primary mb-4">Social Profiles</h2>
        <div className="space-y-4">
          {SOCIAL_FIELDS.map((field) => (
            <div key={field.key}>
              <label className="label capitalize">{field.label}</label>
              <input type="url" value={socialLinks[field.key] || ''}
                onChange={(e) => updateSocial(field.key, e.target.value)}
                className="input-field py-2.5 text-sm" placeholder={field.placeholder} />
            </div>
          ))}
        </div>
      </div>

      {/* ─── Action Buttons ─── */}
      <div className="flex gap-3 mt-6">
        <button onClick={() => router.push('/profile')}
          className="btn-secondary flex-1 py-3 text-sm font-semibold">
          Cancel
        </button>
        <button onClick={handleSave} disabled={saving}
          className="btn-primary flex-1 py-3 text-sm font-semibold">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
