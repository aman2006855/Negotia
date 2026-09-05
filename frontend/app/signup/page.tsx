'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { BriefcaseIcon, SearchIcon, XIcon, UserIcon, BuildingIcon } from '@/components/icons';

type Step = 'email' | 'password' | 'role' | 'entity' | 'profile';

const SKILL_OPTIONS = [
  'React', 'Next.js', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Rust',
  'PostgreSQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes', 'GraphQL', 'REST APIs',
  'React Native', 'Flutter', 'Swift', 'Kotlin', 'Java', 'C#', '.NET',
  'Tailwind CSS', 'Figma', 'UI/UX Design', 'DevOps', 'CI/CD', 'Machine Learning',
  'Data Analysis', 'Blockchain', 'Web3', 'Solidity', 'Three.js', 'Vue.js', 'Angular',
  'PHP', 'Laravel', 'Ruby on Rails', 'Django', 'Flask', 'Spring Boot',
];

const EXPERIENCE_OPTIONS = [
  { value: '0-1', label: 'Less than 1 year' },
  { value: '1-3', label: '1-3 years' },
  { value: '3+', label: '3+ years' },
];

const INDUSTRY_OPTIONS = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
  'E-commerce', 'Real Estate', 'Entertainment', 'Manufacturing', 'Consulting',
  'Legal', 'Non-profit', 'Gaming', 'Media', 'Travel', 'Food & Beverage',
  'Automotive', 'Aerospace', 'Telecommunications', 'Energy',
];

const COMPANY_SIZE_OPTIONS = [
  'Solo (1 person)', 'Small (2-10)', 'Medium (11-50)', 'Large (51-200)', 'Enterprise (200+)',
];

const BUDGET_RANGE_OPTIONS = [
  'Under $500', '$500 - $2,000', '$2,000 - $5,000', '$5,000 - $15,000', '$15,000 - $50,000', '$50,000+',
];

function validateEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function validatePassword(p: string): { valid: boolean; error: string } {
  if (p.length < 8) return { valid: false, error: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(p)) return { valid: false, error: 'Password must contain an uppercase letter' };
  if (!/[a-z]/.test(p)) return { valid: false, error: 'Password must contain a lowercase letter' };
  if (!/[0-9]/.test(p)) return { valid: false, error: 'Password must contain a number' };
  return { valid: true, error: '' };
}

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

  const isGoogleProvider = searchParams.get('provider') === 'google';
  const initialStep = searchParams.get('step') === 'profile' ? 'role' : 'email';

  const [step, setStep] = useState<Step>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [role, setRole] = useState<'CLIENT' | 'FREELANCER'>('FREELANCER');
  const [entityType, setEntityType] = useState<'INDIVIDUAL' | 'COMPANY'>('INDIVIDUAL');

  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  const [skills, setSkills] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<{ label: string; url: string }[]>([]);
  const [pastWork, setPastWork] = useState<{ title: string; description: string }[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  useEffect(() => {
    if (isGoogleProvider && user) {
      setName(user.name);
      setEmail(user.email);
      setStep('role');
    }
  }, [isGoogleProvider, user]);

  const filteredSkills = SKILL_OPTIONS.filter(
    (s) => s.toLowerCase().includes(skillSearch.toLowerCase()) && !skills.includes(s)
  );

  function handleEmailNext() {
    setError('');
    setEmailError('');
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Enter a valid email address');
      return;
    }
    setStep('password');
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPasswordError('');
    const v = validatePassword(password);
    if (!v.valid) {
      setPasswordError(v.error);
      return;
    }
    setLoading(true);
    try {
      await api.signup({ name: name || email.split('@')[0], email, password });
      setStep('role');
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
        setStep('role');
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
        portfolioLinks, pastWork, profileCompleted: true,
      } as any);
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
  function removeSkill(skill: string) { setSkills(skills.filter((s) => s !== skill)); }
  function addPortfolioLink() { setPortfolioLinks([...portfolioLinks, { label: '', url: '' }]); }
  function updatePortfolioLink(i: number, field: 'label' | 'url', v: string) {
    const u = [...portfolioLinks]; u[i] = { ...u[i], [field]: v }; setPortfolioLinks(u);
  }
  function removePortfolioLink(i: number) { setPortfolioLinks(portfolioLinks.filter((_, j) => j !== i)); }
  function addPastWork() { setPastWork([...pastWork, { title: '', description: '' }]); }
  function updatePastWork(i: number, field: 'title' | 'description', v: string) {
    const u = [...pastWork]; u[i] = { ...u[i], [field]: v }; setPastWork(u);
  }
  function removePastWork(i: number) { setPastWork(pastWork.filter((_, j) => j !== i)); }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-medium">
            <BriefcaseIcon className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-semibold text-txt-primary tracking-tight">
            {step === 'email' && 'Create your account'}
            {step === 'password' && 'Set a password'}
            {step === 'role' && 'How will you use Negotia?'}
            {step === 'entity' && (role === 'CLIENT' ? 'Tell us about your company' : 'How do you work?')}
            {step === 'profile' && 'Set up your profile'}
          </h1>
          <p className="mt-1 text-sm text-txt-secondary">
            {step === 'email' && 'Join Negotia and start negotiating'}
            {step === 'password' && 'Secure your account'}
            {step === 'role' && 'Choose your primary role on the platform'}
            {step === 'entity' && (role === 'CLIENT'
              ? 'Help us personalize your experience'
              : 'Help clients understand your work style')}
            {step === 'profile' && 'Tell us about yourself so we can match you better'}
          </p>
        </div>

        {step === 'email' && (
          <div className="card p-6 space-y-4">
            {error && <div className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600 border border-danger-500/20">{error}</div>}

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
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-surface px-2 text-txt-tertiary">or</span></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="label">Email address</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailNext()}
                  className={`input-field ${emailError ? 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500' : ''}`}
                  placeholder="you@example.com" autoFocus />
                {emailError && <p className="mt-1 text-xs text-danger-600">{emailError}</p>}
              </div>
              <button onClick={handleEmailNext} className="btn-primary w-full">Continue</button>
            </div>
          </div>
        )}

        {step === 'password' && (
          <div className="card p-6 space-y-4">
            {error && <div className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600 border border-danger-500/20">{error}</div>}

            <div className="rounded-lg bg-bg-subtle px-3.5 py-2.5 text-sm text-txt-secondary">
              <span className="font-medium text-txt-primary">{email}</span>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3">
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                    className={`input-field pr-10 ${passwordError ? 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500' : ''}`}
                    placeholder="Min. 8 characters" autoFocus minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-tertiary hover:text-txt-secondary">
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && <p className="mt-1 text-xs text-danger-600">{passwordError}</p>}
                {password && !passwordError && validatePassword(password).valid && (
                  <p className="mt-1 text-xs text-success-600">Strong password</p>
                )}
              </div>

              <div className="space-y-1.5 pt-1">
                <p className="text-xs text-txt-tertiary">Password must contain:</p>
                <div className="grid grid-cols-2 gap-1">
                  {[
                    { label: '8+ characters', check: password.length >= 8 },
                    { label: 'Uppercase letter', check: /[A-Z]/.test(password) },
                    { label: 'Lowercase letter', check: /[a-z]/.test(password) },
                    { label: 'A number', check: /[0-9]/.test(password) },
                  ].map((rule) => (
                    <div key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.check ? 'text-success-600' : 'text-txt-tertiary'}`}>
                      {rule.check ? (
                        <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="h-3 w-3 shrink-0" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" /></svg>
                      )}
                      {rule.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep('email')} className="btn-secondary flex-1">Back</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Creating account...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 'role' && (
          <div className="card p-6 space-y-6">
            {error && <div className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600 border border-danger-500/20">{error}</div>}

            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setRole('FREELANCER')}
                  className={`rounded-xl border-2 px-4 py-6 text-center transition-all ${
                    role === 'FREELANCER'
                      ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-50/20 dark:text-accent-400'
                      : 'border-border-subtle bg-surface text-txt-secondary hover:border-border-strong'
                  }`}>
                  <UserIcon className="mx-auto h-8 w-8 mb-2" />
                  <div className="text-sm font-semibold">Freelancer</div>
                  <div className="mt-1 text-xs text-txt-tertiary">Find work & get hired</div>
                </button>
                <button type="button" onClick={() => setRole('CLIENT')}
                  className={`rounded-xl border-2 px-4 py-6 text-center transition-all ${
                    role === 'CLIENT'
                      ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-50/20 dark:text-accent-400'
                      : 'border-border-subtle bg-surface text-txt-secondary hover:border-border-strong'
                  }`}>
                  <BuildingIcon className="mx-auto h-8 w-8 mb-2" />
                  <div className="text-sm font-semibold">Client</div>
                  <div className="mt-1 text-xs text-txt-tertiary">Post jobs & hire</div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              {!isGoogleProvider && (
                <button onClick={() => setStep('password')} className="btn-secondary flex-1">Back</button>
              )}
              <button onClick={() => setStep('entity')} className="btn-primary flex-1">Continue</button>
            </div>
          </div>
        )}

        {step === 'entity' && (
          <div className="card p-6 space-y-6">
            {error && <div className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600 border border-danger-500/20">{error}</div>}

            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setEntityType('INDIVIDUAL')}
                  className={`rounded-xl border-2 px-4 py-5 text-center transition-all ${
                    entityType === 'INDIVIDUAL'
                      ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-50/20 dark:text-accent-400'
                      : 'border-border-subtle bg-surface text-txt-secondary hover:border-border-strong'
                  }`}>
                  <UserIcon className="mx-auto h-6 w-6 mb-1.5" />
                  <div className="text-sm font-semibold">Individual</div>
                  <div className="mt-0.5 text-xs text-txt-tertiary">Working solo</div>
                </button>
                <button type="button" onClick={() => setEntityType('COMPANY')}
                  className={`rounded-xl border-2 px-4 py-5 text-center transition-all ${
                    entityType === 'COMPANY'
                      ? 'border-accent-500 bg-accent-50 text-accent-700 dark:bg-accent-50/20 dark:text-accent-400'
                      : 'border-border-subtle bg-surface text-txt-secondary hover:border-border-strong'
                  }`}>
                  <BuildingIcon className="mx-auto h-6 w-6 mb-1.5" />
                  <div className="text-sm font-semibold">Company</div>
                  <div className="mt-0.5 text-xs text-txt-tertiary">Team or business</div>
                </button>
              </div>
            </div>

            {entityType === 'COMPANY' && (
              <>
                <div>
                  <label className="label">Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                    className="input-field" placeholder="Acme Inc." />
                </div>
                <div>
                  <label className="label">Industry</label>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="input-field">
                    <option value="">Select industry</option>
                    {INDUSTRY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Company Size</label>
                  <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} className="input-field">
                    <option value="">Select size</option>
                    {COMPANY_SIZE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                {role === 'CLIENT' && (
                  <div>
                    <label className="label">Typical Project Budget</label>
                    <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} className="input-field">
                      <option value="">Select budget range</option>
                      {BUDGET_RANGE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}

            {role === 'FREELANCER' && entityType === 'INDIVIDUAL' && (
              <div>
                <label className="label">Preferred work style</label>
                <select value={experience} onChange={(e) => setExperience(e.target.value)} className="input-field">
                  <option value="">Select</option>
                  <option value="full-time">Full-time freelance</option>
                  <option value="part-time">Part-time / Side projects</option>
                  <option value="contract">Long-term contracts</option>
                  <option value="project">Project-based</option>
                </select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('role')} className="btn-secondary flex-1">Back</button>
              <button onClick={() => setStep('profile')} className="btn-primary flex-1">Continue</button>
            </div>
          </div>
        )}

        {step === 'profile' && (
          <div className="card p-6 space-y-6">
            {error && <div className="rounded-lg bg-danger-50 px-3.5 py-2.5 text-sm text-danger-600 border border-danger-500/20">{error}</div>}

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

            <div className="rounded-lg bg-accent-50/50 border border-accent-200/50 px-4 py-3">
              <p className="text-xs text-txt-secondary">
                <span className="font-medium text-accent-700">{role === 'CLIENT' ? 'Client' : 'Freelancer'}</span>
                {' '}&middot;{' '}
                <span className="font-medium text-accent-700">{entityType === 'COMPANY' ? 'Company' : 'Individual'}</span>
                {entityType === 'COMPANY' && companyName && <>{' '}&middot; <span className="font-medium text-accent-700">{companyName}</span></>}
              </p>
            </div>

            {role === 'FREELANCER' && (
              <>
                <div>
                  <label className="label">Skills</label>
                  <div className="relative">
                    <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface px-3 py-2 focus-within:ring-2 focus-within:ring-accent-500/30 focus-within:border-accent-500">
                      <SearchIcon className="h-4 w-4 text-txt-tertiary shrink-0" />
                      <input type="text" value={skillSearch}
                        onChange={(e) => { setSkillSearch(e.target.value); setShowSkillDropdown(true); }}
                        onFocus={() => setShowSkillDropdown(true)}
                        placeholder="Search skills..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-txt-tertiary" />
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
                          <button onClick={() => removeSkill(skill)} className="hover:text-accent-900"><XIcon className="h-3 w-3" /></button>
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
                    {EXPERIENCE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
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
                      <svg className="h-3.5 w-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add link
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
                      <svg className="h-3.5 w-3.5 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add project
                    </button>
                  </div>
                </div>
              </>
            )}

            {role === 'CLIENT' && (
              <div>
                <label className="label">What are you looking for?</label>
                <textarea value={capabilities} onChange={(e) => setCapabilities(e.target.value)}
                  className="input-field resize-none" rows={3}
                  placeholder="Tell freelancers what kind of work you typically need..." />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => setStep('entity')} className="btn-secondary flex-1">Back</button>
              <button onClick={handleProfileSubmit} disabled={loading} className="btn-primary flex-1">
                {loading ? 'Saving...' : 'Complete setup'}
              </button>
            </div>
          </div>
        )}

        {step === 'email' && (
          <p className="mt-6 text-center text-sm text-txt-secondary">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-accent-600 hover:text-accent-700">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
