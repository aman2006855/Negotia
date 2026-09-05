'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { SKILL_OPTIONS, EXPERIENCE_OPTIONS } from '@/lib/mock';
import { BriefcaseIcon, SearchIcon, XIcon, CheckIcon, PlusIcon, GoogleIcon } from '@/components/icons';

type Step = 'auth' | 'profile';

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" /></div>}>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useBoard((s) => s.setUser);
  const user = useBoard((s) => s.user);

  const initialStep = searchParams.get('step') === 'profile' ? 'profile' : 'auth';
  const isGoogleProvider = searchParams.get('provider') === 'google';

  const [step, setStep] = useState<Step>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auth fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Profile fields
  const [role, setRole] = useState<'CLIENT' | 'FREELANCER'>('FREELANCER');
  const [skills, setSkills] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<{ label: string; url: string }[]>([]);
  const [pastWork, setPastWork] = useState<{ title: string; description: string }[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  // If coming from Google OAuth, pre-fill user data
  useEffect(() => {
    if (isGoogleProvider && user) {
      setName(user.name);
      setEmail(user.email);
      setStep('profile');
    }
  }, [isGoogleProvider, user]);

  const filteredSkills = SKILL_OPTIONS.filter(
    (s) => s.toLowerCase().includes(skillSearch.toLowerCase()) && !skills.includes(s)
  );

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.signup({ name, email, password });
      setStep('profile');
    } catch {
      setError('Signup failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setError('');
    try {
      const result: any = await api.googleLogin();
      if (result?.user) {
        setUser(result.user);
        setName(result.user.name);
        setEmail(result.user.email);
        setStep('profile');
      }
    } catch {
      setError('Google sign-up failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleProfileSubmit() {
    setLoading(true);
    try {
      const { user: updatedUser } = await api.updateProfile({
        role, skills, capabilities, experience: experience as any,
        portfolioLinks, pastWork,
      });
      if (updatedUser) setUser(updatedUser);
      router.push('/jobs');
    } catch {
      setError('Profile setup failed');
    } finally {
      setLoading(false);
    }
  }

  function addSkill(skill: string) {
    if (!skills.includes(skill)) setSkills([...skills, skill]);
    setSkillSearch('');
    setShowSkillDropdown(false);
  }

  function removeSkill(skill: string) {
    setSkills(skills.filter((s) => s !== skill));
  }

  function addPortfolioLink() {
    setPortfolioLinks([...portfolioLinks, { label: '', url: '' }]);
  }

  function updatePortfolioLink(index: number, field: 'label' | 'url', value: string) {
    const updated = [...portfolioLinks];
    updated[index] = { ...updated[index], [field]: value };
    setPortfolioLinks(updated);
  }

  function removePortfolioLink(index: number) {
    setPortfolioLinks(portfolioLinks.filter((_, i) => i !== index));
  }

  function addPastWork() {
    setPastWork([...pastWork, { title: '', description: '' }]);
  }

  function updatePastWork(index: number, field: 'title' | 'description', value: string) {
    const updated = [...pastWork];
    updated[index] = { ...updated[index], [field]: value };
    setPastWork(updated);
  }

  function removePastWork(index: number) {
    setPastWork(pastWork.filter((_, i) => i !== index));
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-medium">
            <BriefcaseIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-txt-primary tracking-tight">
            {step === 'auth' ? 'Create your account' : 'Set up your profile'}
          </h1>
          <p className="mt-1 text-sm text-txt-secondary">
            {step === 'auth' ? 'Join Negotia and start negotiating' : 'Tell us about yourself so we can match you better'}
          </p>
        </div>

        {step === 'auth' ? (
          <div className="card p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600 border border-danger-500/20">
                {error}
              </div>
            )}

            <button onClick={handleGoogleSignup} disabled={loading}
              className="btn-secondary w-full justify-center gap-3 py-2.5">
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Signing up...' : 'Continue with Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-surface px-2 text-txt-tertiary">or</span>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="input-field" placeholder="Your name" required />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="input-field" placeholder="you@example.com" required />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input-field" placeholder="Min. 8 characters" required minLength={8} />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Creating account...' : 'Continue'}
              </button>
            </form>
          </div>
        ) : (
          <div className="card p-6 space-y-6">
            {error && (
              <div className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600 border border-danger-500/20">
                {error}
              </div>
            )}

            {isGoogleProvider && user && (
              <div className="flex items-center gap-3 rounded-lg bg-accent-50 px-4 py-3 border border-accent-200">
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <div className="text-sm">
                  <span className="font-medium text-accent-700">Signed in via Google</span>
                  <span className="text-txt-secondary ml-1">— {user.email}</span>
                </div>
              </div>
            )}

            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('FREELANCER')}
                  className={`rounded-xl border-2 px-4 py-4 text-center transition-all ${
                    role === 'FREELANCER'
                      ? 'border-accent-500 bg-accent-50 text-accent-700'
                      : 'border-border-subtle bg-surface text-txt-secondary hover:border-border-strong'
                  }`}
                >
                  <div className="text-sm font-semibold">Freelancer</div>
                  <div className="mt-0.5 text-xs">Find work & get hired</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole('CLIENT')}
                  className={`rounded-xl border-2 px-4 py-4 text-center transition-all ${
                    role === 'CLIENT'
                      ? 'border-accent-500 bg-accent-50 text-accent-700'
                      : 'border-border-subtle bg-surface text-txt-secondary hover:border-border-strong'
                  }`}
                >
                  <div className="text-sm font-semibold">Client</div>
                  <div className="mt-0.5 text-xs">Post jobs & hire</div>
                </button>
              </div>
            </div>

            {role === 'FREELANCER' && (
              <>
                <div>
                  <label className="label">Skills</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 focus-within:ring-2 focus-within:ring-accent-500/30 focus-within:border-accent-500">
                      <SearchIcon className="h-4 w-4 text-txt-tertiary shrink-0" />
                      <input
                        type="text" value={skillSearch}
                        onChange={(e) => { setSkillSearch(e.target.value); setShowSkillDropdown(true); }}
                        onFocus={() => setShowSkillDropdown(true)}
                        placeholder="Search skills..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-txt-tertiary"
                      />
                    </div>
                    {showSkillDropdown && filteredSkills.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-border-subtle bg-surface shadow-medium">
                        {filteredSkills.slice(0, 10).map((skill) => (
                          <button key={skill} onClick={() => addSkill(skill)}
                            className="flex w-full items-center gap-2 px-3.5 py-2.5 text-sm text-left hover:bg-inset transition-colors">
                            <span>{skill}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-medium text-accent-700">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="hover:text-accent-900">
                            <XIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Capabilities</label>
                  <textarea value={capabilities} onChange={(e) => setCapabilities(e.target.value)}
                    className="input-field resize-none" rows={3}
                    placeholder="What can you build? (e.g., Full-stack web apps, mobile UIs, APIs...)" />
                </div>

                <div>
                  <label className="label">Experience</label>
                  <select value={experience} onChange={(e) => setExperience(e.target.value)} className="input-field">
                    <option value="">Select experience level</option>
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">Portfolio Links</label>
                  <div className="space-y-2">
                    {portfolioLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="text" value={link.label} onChange={(e) => updatePortfolioLink(i, 'label', e.target.value)}
                          className="input-field w-28" placeholder="Label" />
                        <input type="url" value={link.url} onChange={(e) => updatePortfolioLink(i, 'url', e.target.value)}
                          className="input-field flex-1" placeholder="https://..." />
                        <button onClick={() => removePortfolioLink(i)} className="btn-ghost p-1.5 text-txt-tertiary hover:text-danger-500">
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addPortfolioLink} className="btn-ghost text-xs text-accent-600">
                      <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add link
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Past Work</label>
                  <div className="space-y-2">
                    {pastWork.map((work, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <input type="text" value={work.title} onChange={(e) => updatePastWork(i, 'title', e.target.value)}
                          className="input-field flex-1" placeholder="Project title" />
                        <button onClick={() => removePastWork(i)} className="btn-ghost p-1.5 text-txt-tertiary hover:text-danger-500 mt-0.5">
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addPastWork} className="btn-ghost text-xs text-accent-600">
                      <PlusIcon className="h-3.5 w-3.5 mr-1" /> Add project
                    </button>
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center gap-3 pt-2">
              {!isGoogleProvider && (
                <button onClick={() => setStep('auth')} className="btn-secondary flex-1">
                  Back
                </button>
              )}
              <button onClick={handleProfileSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Saving...' : isGoogleProvider ? 'Complete setup' : 'Complete setup'}
              </button>
            </div>
          </div>
        )}

        {step === 'auth' && (
          <p className="mt-6 text-center text-sm text-txt-secondary">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-accent-600 hover:text-accent-700">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
