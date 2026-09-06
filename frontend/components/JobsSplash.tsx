'use client';

import { useEffect, useState, useMemo } from 'react';
import { useBoard } from '@/lib/store';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];

function AnimatedWord({ word, delay = 0.5 }: { word: string; delay?: number }) {
  return (
    <h1 className="text-4xl sm:text-5xl font-extrabold mb-3" style={{ perspective: '600px' }}>
      {word.split('').map((ch, i) => (
        <span key={`${word}-${i}`} className="splash-letter" style={{ animationDelay: `${delay + i * 0.04}s` }}>
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </h1>
  );
}

// ─── Template 1: Dark Professional ───
function Template1({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-slate-800 to-gray-950 text-white cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      <div className="absolute inset-0 splash-grid" style={{ backgroundImage: 'linear-gradient(hsla(220,60%,50%,0.06) 1px, transparent 1px), linear-gradient(90deg, hsla(220,60%,50%,0.06) 1px, transparent 1px)', backgroundSize: '50px 50px' }} />
      <div className="splash-sub relative z-10 mb-6" style={{ animationDelay: '0.15s' }}>
        <div className="w-20 h-20 rounded-2xl border-2 border-blue-500/40 bg-blue-500/10 flex items-center justify-center splash-glow-border" style={{ animationName: 'splash-glow-border' }}>
          <svg className="w-10 h-10 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
      </div>
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-blue-300/60 text-sm font-medium mb-2 tracking-widest uppercase" style={{ animationDelay: '0.3s' }}>Welcome back, {firstName}</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 splash-neon text-blue-300">Find Jobs</h1>
        <p className="splash-sub text-blue-300/40 text-xs mt-4" style={{ animationDelay: '1.2s' }}>Negotiate · Build · Earn</p>
      </div>
      <div className="splash-sub absolute bottom-10 text-blue-300/20 text-xs" style={{ animationDelay: '2s' }}>Tap to enter</div>
    </div>
  );
}

// ─── Template 2: Warm Gradient ───
function Template2({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i} className="absolute rounded-full bg-white/10" style={{
            width: 20 + Math.random() * 40, height: 20 + Math.random() * 40,
            left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`,
            animation: `splash-float ${2 + Math.random() * 2}s ${Math.random()}s ease-in-out infinite`,
          }} />
        ))}
      </div>
      <div className="splash-sub relative z-10 mb-6" style={{ animationDelay: '0.15s' }}>
        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl splash-bounce-in">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
      </div>
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-white/70 text-sm font-medium mb-2 tracking-widest uppercase" style={{ animationDelay: '0.3s' }}>Welcome, {firstName}</p>
        <AnimatedWord word="Find Work" delay={0.45} />
        <p className="splash-sub text-white/50 text-xs mt-4" style={{ animationDelay: '1.2s' }}>Negotiate · Build · Earn</p>
      </div>
      <div className="splash-sub absolute bottom-10 text-white/30 text-xs" style={{ animationDelay: '2s' }}>Tap to enter</div>
    </div>
  );
}

// ─── Template 3: Blueprint Grid ───
function Template3({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0a1628] text-cyan-300 cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      <div className="absolute inset-0 splash-grid" style={{ backgroundImage: 'linear-gradient(hsla(190,80%,40%,0.1) 1px, transparent 1px), linear-gradient(90deg, hsla(190,80%,40%,0.1) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, hsla(190,80%,40%,0.08) 0%, transparent 70%)' }} />
      <div className="splash-sub relative z-10 mb-6" style={{ animationDelay: '0.15s' }}>
        <div className="w-20 h-20 rounded-lg border border-cyan-400/30 bg-cyan-400/5 flex items-center justify-center" style={{ boxShadow: '0 0 30px hsla(190,80%,40%,0.15)' }}>
          <svg className="w-10 h-10 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
      </div>
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-cyan-300/50 text-xs mb-2 tracking-[0.3em] uppercase font-mono" style={{ animationDelay: '0.3s' }}>Welcome, {firstName}</p>
        <AnimatedWord word="Get Hired" delay={0.5} />
        <p className="splash-sub text-cyan-300/30 text-xs mt-4 font-mono" style={{ animationDelay: '1.2s' }}>{'>'} negotiate → build → earn</p>
      </div>
      <div className="splash-sub absolute bottom-10 text-cyan-300/15 text-xs font-mono" style={{ animationDelay: '2s' }}>[ tap to enter ]</div>
    </div>
  );
}

// ─── Template 4: Minimal Clean ───
function Template4({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white text-gray-900 cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      <div className="splash-sub relative z-10 mb-6" style={{ animationDelay: '0.15s' }}>
        <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
      </div>
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-gray-400 text-sm mb-2 tracking-widest uppercase" style={{ animationDelay: '0.3s' }}>Welcome, {firstName}</p>
        <AnimatedWord word="Jobs" delay={0.5} />
        <p className="splash-sub text-gray-400 text-xs mt-4" style={{ animationDelay: '1.2s' }}>Find your next opportunity</p>
      </div>
      <div className="splash-sub absolute bottom-10 text-gray-300 text-xs" style={{ animationDelay: '2s' }}>Tap to enter</div>
    </div>
  );
}

// ─── Template 5: Gradient Shift ───
function Template5({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-r from-blue-600 via-emerald-500 to-teal-400 splash-bg-pan text-white cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} className="absolute text-xl" style={{
            left: `${8 + (i * 8) % 84}%`, top: `${8 + (i * 17) % 75}%`,
            opacity: 0, animation: `splash-icon-pop 0.4s ${0.1 + i * 0.07}s ease-out forwards, splash-float ${2 + (i % 3) * 0.4}s ${0.5 + i * 0.07}s ease-in-out infinite`,
          }}>{['💼', '🤝', '💰', '⚡', '🎯', '📈', '🔥', '💡', '🏆', '✨', '🚀', '📋'][i]}</div>
        ))}
      </div>
      <div className="splash-sub relative z-10 mb-6" style={{ animationDelay: '0.15s' }}>
        <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl splash-bounce-in">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
      </div>
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-white/70 text-sm font-medium mb-2 tracking-widest uppercase" style={{ animationDelay: '0.3s' }}>Welcome, {firstName}</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 splash-shimmer-text">Find Jobs</h1>
        <p className="splash-sub text-white/50 text-xs mt-4" style={{ animationDelay: '1.2s' }}>Negotiate · Build · Earn</p>
      </div>
      <div className="splash-sub absolute bottom-10 text-white/30 text-xs" style={{ animationDelay: '2s' }}>Tap to enter</div>
    </div>
  );
}

const TEMPLATES = [Template1, Template2, Template3, Template4, Template5];

export function JobsSplash({ onDone }: { onDone: () => void }) {
  const user = useBoard((s) => s.user);
  const [Template] = useState(() => TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]);
  const firstName = (user?.fullName || user?.name || 'there').split(' ')[0];

  return <Template firstName={firstName} onDone={onDone} />;
}
