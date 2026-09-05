'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { BriefcaseIcon, SearchIcon, XIcon, UserIcon, BuildingIcon } from '@/components/icons';
import { CustomSelect } from '@/components/CustomSelect';

const VALID_STEPS = ['email', 'password', 'role', 'entity', 'profile'] as const;
type Step = (typeof VALID_STEPS)[number];
const STEP_INDEX: Record<Step, number> = { email: 0, password: 1, role: 2, entity: 3, profile: 4 };

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

const WORK_STYLE_OPTIONS = [
  { value: 'full-time', label: 'Full-time freelance' },
  { value: 'part-time', label: 'Part-time / Side projects' },
  { value: 'contract', label: 'Long-term contracts' },
  { value: 'project', label: 'Project-based' },
];

const INDUSTRY_OPTIONS = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Education', label: 'Education' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'E-commerce', label: 'E-commerce' },
  { value: 'Real Estate', label: 'Real Estate' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Non-profit', label: 'Non-profit' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Media', label: 'Media' },
  { value: 'Travel', label: 'Travel' },
  { value: 'Food & Beverage', label: 'Food & Beverage' },
  { value: 'Automotive', label: 'Automotive' },
  { value: 'Aerospace', label: 'Aerospace' },
  { value: 'Telecommunications', label: 'Telecommunications' },
  { value: 'Energy', label: 'Energy' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: 'Solo (1 person)', label: 'Solo (1 person)' },
  { value: 'Small (2-10)', label: 'Small (2-10)' },
  { value: 'Medium (11-50)', label: 'Medium (11-50)' },
  { value: 'Large (51-200)', label: 'Large (51-200)' },
  { value: 'Enterprise (200+)', label: 'Enterprise (200+)' },
];

const BUDGET_RANGE_OPTIONS = [
  { value: 'Under $500', label: 'Under $500' },
  { value: '$500 - $2,000', label: '$500 - $2,000' },
  { value: '$2,000 - $5,000', label: '$2,000 - $5,000' },
  { value: '$5,000 - $15,000', label: '$5,000 - $15,000' },
  { value: '$15,000 - $50,000', label: '$15,000 - $50,000' },
  { value: '$50,000+', label: '$50,000+' },
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

function getStep(raw: string | null): Step {
  if (raw && VALID_STEPS.includes(raw as Step)) return raw as Step;
  return 'email';
}

function StepProgress({ current }: { current: Step }) {
  const idx = STEP_INDEX[current];
  return (
    <div className="flex items-center gap-1.5 w-full mb-8">
      {VALID_STEPS.map((_, i) => (
        <div key={i} className="flex-1">
          <div className={`h-1.5 rounded-full transition-all duration-300 ${
            i <= idx ? 'bg-accent-600' : 'bg-border-subtle'
          }`} />
        </div>
      ))}
    </div>
  );
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

  const step = getStep(searchParams.get('step'));
  function go(s: Step) { router.push(`/signup?step=${s}`); }

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
  const [workStyle, setWorkStyle] = useState('');

  const [skills, setSkills] = useState<string[]>([]);
  const [capabilities, setCapabilities] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolioLinks, setPortfolioLinks] = useState<{ label: string; url: string }[]>([]);
  const [pastWork, setPastWork] = useState<{ title: string; url: string }[]>([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  const filteredSkills = SKILL_OPTIONS.filter(
    (s) => s.toLowerCase().includes(skillSearch.toLowerCase()) && !skills.includes(s)
  );

  function handleEmailNext() {
    setError('');
    setEmailError('');
    if (!email) { setEmailError('Email is required'); return; }
    if (!validateEmail(email)) { setEmailError('Enter a valid email address'); return; }
    go('password');
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setPasswordError('');
    const v = validatePassword(password);
    if (!v.valid) { setPasswordError(v.error); return; }
    setLoading(true);
    try {
      await api.signup({ name: name || email.split('@')[0], email, password });
      go('role');
    } catch {
      setError('Signup failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setError('');
    try { await api.googleLogin(); } catch { setError('Google sign-up failed'); setLoading(false); }
  }

  async function handleProfileSubmit() {
    setLoading(true);
    setError('');
    try {
      const { user: updatedUser } = await api.updateProfile({
        name: name || email.split('@')[0] || 'User',
        role,
        skills,
        capabilities,
        experience: experience || undefined,
        portfolioLinks,
        pastWork,
        profileCompleted: true,
      } as any);
      if (updatedUser) setUser(updatedUser);
      router.push('/jobs');
    } catch (err: any) {
      console.error('Profile setup failed:', err);
      setError(err?.message || 'Profile setup failed. Please try again.');
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
  function addPastWork() { setPastWork([...pastWork, { title: '', url: '' }]); }
  function updatePastWork(i: number, field: 'title' | 'url', v: string) {
    const u = [...pastWork]; u[i] = { ...u[i], [field]: v }; setPastWork(u);
  }
  function removePastWork(i: number) { setPastWork(pastWork.filter((_, j) => j !== i)); }

  const titles: Record<Step, string> = {
    email: 'Create your account', password: 'Set a password',
    role: 'How will you use Negotia?',
    entity: role === 'CLIENT' ? 'Tell us about your company' : 'How do you work?',
    profile: 'Set up your profile',
  };
  const subtitles: Record<Step, string> = {
    email: 'Join Negotia and start negotiating', password: 'Secure your account',
    role: 'Choose your primary role on the platform',
    entity: role === 'CLIENT' ? 'Help us personalize your experience' : 'Help clients understand your work style',
    profile: 'Tell us about yourself so we can match you better',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas px-4 py-10 sm:py-16">
      <div className="w-full max-w-md mx-auto">
        <div className="flex justify-center mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-600 text-white shadow-medium">
            <BriefcaseIcon className="h-7 w-7" />
          </div>
        </div>

        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-txt-primary">{titles[step]}</h1>
          <p className="mt-2 text-sm text-txt-secondary">{subtitles[step]}</p>
        </div>

        <StepProgress current={step} />

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-danger-50 border border-danger-500/20 px-4 py-3 text-sm text-danger-600">
            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
            {error}
          </div>
        )}

        {/* ─── Step 1: Email ─── */}
        {step === 'email' && (
          <div className="card p-6 sm:p-8 space-y-5">
            <button onClick={handleGoogleSignup} disabled={loading}
              className="btn-secondary w-full justify-center gap-3 py-3 text-sm font-semibold">
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {loading ? 'Signing up...' : 'Continue with Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border-subtle" /></div>
              <div className="relative flex justify-center text-xs"><span className="bg-surface px-3 text-txt-tertiary font-medium">or</span></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailNext()}
                  className={`input-field py-3 ${emailError ? 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500' : ''}`}
                  placeholder="you@example.com" autoFocus />
                {emailError && <p className="mt-1.5 text-xs text-danger-600">{emailError}</p>}
              </div>
              <button onClick={handleEmailNext} className="btn-primary w-full py-3 text-sm font-semibold">Continue</button>
            </div>
          </div>
        )}

        {/* ─── Step 2: Password ─── */}
        {step === 'password' && (
          <div className="card p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-inset px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-50 text-accent-600">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <span className="text-sm font-medium text-txt-primary truncate">{email}</span>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                    className={`input-field py-3 pr-11 ${passwordError ? 'border-danger-500 focus:ring-danger-500/30 focus:border-danger-500' : ''}`}
                    placeholder="Min. 8 characters" autoFocus minLength={8} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-txt-tertiary hover:text-txt-secondary hover:bg-inset transition-colors">
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
                {passwordError && <p className="mt-1.5 text-xs text-danger-600">{passwordError}</p>}
                {password && !passwordError && validatePassword(password).valid && (
                  <p className="mt-1.5 text-xs text-success-600 font-medium">Strong password</p>
                )}
              </div>

              <div className="rounded-xl bg-inset p-3.5 space-y-2">
                <p className="text-xs font-medium text-txt-tertiary">Password must contain:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {[
                    { label: '8+ characters', check: password.length >= 8 },
                    { label: 'Uppercase letter', check: /[A-Z]/.test(password) },
                    { label: 'Lowercase letter', check: /[a-z]/.test(password) },
                    { label: 'A number', check: /[0-9]/.test(password) },
                  ].map((rule) => (
                    <div key={rule.label} className={`flex items-center gap-2 text-xs ${rule.check ? 'text-success-600 font-medium' : 'text-txt-tertiary'}`}>
                      {rule.check ? (
                        <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><circle cx="10" cy="10" r="3" /></svg>
                      )}
                      {rule.label}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => go('email')} className="btn-secondary flex-1 py-3">Back</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-sm font-semibold">
                  {loading ? 'Creating account...' : 'Continue'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ─── Step 3: Role ─── */}
        {step === 'role' && (
          <div className="card p-6 sm:p-8 space-y-6">
            <label className="label text-base font-semibold">I am a</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => { setRole('FREELANCER'); go('entity'); }}
                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-border-subtle bg-surface p-6 text-center transition-all duration-200 hover:border-accent-400 hover:bg-accent-50/50 cursor-pointer">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-inset text-txt-secondary group-hover:bg-accent-100 group-hover:text-accent-600 transition-colors duration-200 mb-3">
                  <UserIcon className="h-7 w-7" />
                </div>
                <div className="text-sm font-semibold text-txt-primary">Freelancer</div>
                <div className="mt-1 text-xs text-txt-tertiary">Find work & get hired</div>
              </button>
              <button type="button" onClick={() => { setRole('CLIENT'); go('entity'); }}
                className="group flex flex-col items-center justify-center rounded-2xl border-2 border-border-subtle bg-surface p-6 text-center transition-all duration-200 hover:border-accent-400 hover:bg-accent-50/50 cursor-pointer">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-inset text-txt-secondary group-hover:bg-accent-100 group-hover:text-accent-600 transition-colors duration-200 mb-3">
                  <BuildingIcon className="h-7 w-7" />
                </div>
                <div className="text-sm font-semibold text-txt-primary">Client</div>
                <div className="mt-1 text-xs text-txt-tertiary">Post jobs & hire</div>
              </button>
            </div>
          </div>
        )}

        {/* ─── Step 4: Entity ─── */}
        {step === 'entity' && (
          <div className="card p-6 sm:p-8 space-y-6">
            <label className="label text-base font-semibold">I am a</label>
            <div className="grid grid-cols-2 gap-4">
              <button type="button" onClick={() => setEntityType('INDIVIDUAL')}
                className={`group flex flex-col items-center justify-center rounded-2xl border-2 p-5 text-center transition-all duration-200 cursor-pointer ${
                  entityType === 'INDIVIDUAL' ? 'border-accent-500 bg-accent-50 dark:bg-accent-50/20 shadow-soft' : 'border-border-subtle bg-surface hover:border-accent-400 hover:bg-accent-50/50'
                }`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-2 transition-colors ${
                  entityType === 'INDIVIDUAL' ? 'bg-accent-100 text-accent-600' : 'bg-inset text-txt-secondary group-hover:bg-accent-100 group-hover:text-accent-600'
                }`}>
                  <UserIcon className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-txt-primary">Individual</div>
                <div className="mt-0.5 text-xs text-txt-tertiary">Working solo</div>
              </button>
              <button type="button" onClick={() => setEntityType('COMPANY')}
                className={`group flex flex-col items-center justify-center rounded-2xl border-2 p-5 text-center transition-all duration-200 cursor-pointer ${
                  entityType === 'COMPANY' ? 'border-accent-500 bg-accent-50 dark:bg-accent-50/20 shadow-soft' : 'border-border-subtle bg-surface hover:border-accent-400 hover:bg-accent-50/50'
                }`}>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl mb-2 transition-colors ${
                  entityType === 'COMPANY' ? 'bg-accent-100 text-accent-600' : 'bg-inset text-txt-secondary group-hover:bg-accent-100 group-hover:text-accent-600'
                }`}>
                  <BuildingIcon className="h-6 w-6" />
                </div>
                <div className="text-sm font-semibold text-txt-primary">Company</div>
                <div className="mt-0.5 text-xs text-txt-tertiary">Team or business</div>
              </button>
            </div>

            {entityType === 'COMPANY' && (
              <div className="space-y-4 animate-fade-in">
                <div>
                  <label className="label">Company Name</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="input-field py-3" placeholder="Acme Inc." />
                </div>
                <CustomSelect value={industry} onChange={setIndustry} options={INDUSTRY_OPTIONS} placeholder="Select industry" />
                <CustomSelect value={companySize} onChange={setCompanySize} options={COMPANY_SIZE_OPTIONS} placeholder="Select size" />
                {role === 'CLIENT' && <CustomSelect value={budgetRange} onChange={setBudgetRange} options={BUDGET_RANGE_OPTIONS} placeholder="Select budget range" />}
              </div>
            )}

            {role === 'FREELANCER' && entityType === 'INDIVIDUAL' && (
              <div className="animate-fade-in">
                <label className="label">Preferred work style</label>
                <CustomSelect value={workStyle} onChange={setWorkStyle} options={WORK_STYLE_OPTIONS} placeholder="Select work style" />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button onClick={() => go('role')} className="btn-secondary flex-1 py-3">Back</button>
              <button onClick={() => go('profile')} className="btn-primary flex-1 py-3 text-sm font-semibold">Continue</button>
            </div>
          </div>
        )}

        {/* ─── Step 5: Profile ─── */}
        {step === 'profile' && (
          <div className="card p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-2 rounded-xl bg-accent-50/80 border border-accent-200/60 px-4 py-2.5">
              <span className="inline-flex items-center rounded-full bg-accent-600 px-2.5 py-0.5 text-xs font-medium text-white">
                {role === 'CLIENT' ? 'Client' : 'Freelancer'}
              </span>
              <span className="text-txt-tertiary">&middot;</span>
              <span className="inline-flex items-center rounded-full bg-inset px-2.5 py-0.5 text-xs font-medium text-txt-secondary">
                {entityType === 'COMPANY' ? 'Company' : 'Individual'}
              </span>
              {entityType === 'COMPANY' && companyName && (
                <>
                  <span className="text-txt-tertiary">&middot;</span>
                  <span className="text-xs font-medium text-accent-700 truncate max-w-[120px]">{companyName}</span>
                </>
              )}
            </div>

            {role === 'FREELANCER' && (
              <div className="space-y-5 animate-fade-in">
                <div>
                  <label className="label">Skills</label>
                  <div className="relative">
                    <div className="flex items-center gap-2.5 rounded-xl border border-border-subtle bg-surface px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-accent-500/30 focus-within:border-accent-500 transition-all">
                      <SearchIcon className="h-4 w-4 text-txt-tertiary shrink-0" />
                      <input type="text" value={skillSearch} onChange={(e) => { setSkillSearch(e.target.value); setShowSkillDropdown(true); }}
                        onFocus={() => setShowSkillDropdown(true)} placeholder="Search skills..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-txt-tertiary" />
                    </div>
                    {showSkillDropdown && filteredSkills.length > 0 && (
                      <div className="absolute z-20 mt-1.5 w-full max-h-48 overflow-y-auto rounded-xl border border-border-subtle bg-surface shadow-strong">
                        {filteredSkills.slice(0, 10).map((skill) => (
                          <button key={skill} onClick={() => addSkill(skill)}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-left hover:bg-inset transition-colors">
                            <span>{skill}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-accent-50 border border-accent-200/60 px-2.5 py-1 text-xs font-medium text-accent-700">
                          {skill}
                          <button onClick={() => removeSkill(skill)} className="ml-0.5 rounded-full p-0.5 hover:bg-accent-100 transition-colors"><XIcon className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Capabilities</label>
                  <textarea value={capabilities} onChange={(e) => setCapabilities(e.target.value)}
                    className="input-field resize-none py-3" rows={3} placeholder="What can you build? (e.g., Full-stack web apps, mobile UIs, APIs...)" />
                </div>

                <div>
                  <label className="label">Experience</label>
                  <CustomSelect value={experience} onChange={setExperience} options={EXPERIENCE_OPTIONS} placeholder="Select experience level" />
                </div>

                <div>
                  <label className="label">Portfolio Links</label>
                  <div className="space-y-2.5">
                    {portfolioLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input type="text" value={link.label} onChange={(e) => updatePortfolioLink(i, 'label', e.target.value)}
                          className="input-field w-28 py-2.5" placeholder="Label" />
                        <input type="url" value={link.url} onChange={(e) => updatePortfolioLink(i, 'url', e.target.value)}
                          className="input-field flex-1 py-2.5" placeholder="https://..." />
                        <button onClick={() => removePortfolioLink(i)} className="shrink-0 p-2 rounded-lg text-txt-tertiary hover:text-danger-500 hover:bg-danger-50 transition-colors">
                          <XIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button onClick={addPortfolioLink} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add link
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label">Past Work</label>
                  <div className="space-y-3">
                    {pastWork.map((work, i) => (
                      <div key={i} className="rounded-xl border border-border-subtle bg-surface p-3 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-txt-tertiary">Project {i + 1}</span>
                          <button onClick={() => removePastWork(i)} className="p-1 rounded-md text-txt-tertiary hover:text-danger-500 hover:bg-danger-50 transition-colors">
                            <XIcon className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <input type="text" value={work.title} onChange={(e) => updatePastWork(i, 'title', e.target.value)}
                          className="input-field w-full py-2.5 text-sm" placeholder="Project title" />
                        <input type="url" value={work.url} onChange={(e) => updatePastWork(i, 'url', e.target.value)}
                          className="input-field w-full py-2.5 text-sm" placeholder="Project URL (optional)" />
                      </div>
                    ))}
                    <button onClick={addPastWork} className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors">
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add project
                    </button>
                  </div>
                </div>
              </div>
            )}

            {role === 'CLIENT' && (
              <div className="animate-fade-in">
                <label className="label">What are you looking for?</label>
                <textarea value={capabilities} onChange={(e) => setCapabilities(e.target.value)}
                  className="input-field resize-none py-3" rows={3} placeholder="Tell freelancers what kind of work you typically need..." />
              </div>
            )}

            <div className="flex gap-3 pt-3">
              <button onClick={() => go('entity')} className="btn-secondary flex-1 py-3">Back</button>
              <button onClick={handleProfileSubmit} disabled={loading} className="btn-primary flex-1 py-3 text-sm font-semibold">
                {loading ? 'Saving...' : 'Complete setup'}
              </button>
            </div>
          </div>
        )}

        {step === 'email' && (
          <p className="mt-8 text-center text-sm text-txt-secondary">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-accent-600 hover:text-accent-700 transition-colors">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
