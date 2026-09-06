'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { ArrowLeftIcon } from '@/components/icons';

export default function EditProfilePage() {
  const router = useRouter();
  const user = useBoard((s) => s.user);
  const setUser = useBoard((s) => s.setUser);
  const showToast = useBoard((s) => s.showToast);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [about, setAbout] = useState('');
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
      const { user: updatedUser } = await api.updateProfile({
        fullName: fullName.trim(),
        username,
        about: about.trim() || undefined,
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

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="pb-24 max-w-lg mx-auto px-4 py-6">
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

      {/* Actions */}
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
