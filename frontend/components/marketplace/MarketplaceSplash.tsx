'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useBoard } from '@/lib/store';

const COLORS = ['#a855f7', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

function Confetti({ count = 25 }: { count?: number }) {
  const pieces = useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i, left: Math.random() * 100, color: COLORS[i % COLORS.length],
      delay: Math.random() * 1.2, duration: 1.8 + Math.random() * 1.5, size: 5 + Math.random() * 6,
    })), [count]);
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p) => (
        <div key={p.id} className="splash-confetti" style={{
          left: `${p.left}%`, top: '-10px', width: p.size, height: p.size,
          backgroundColor: p.color, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
        }} />
      ))}
    </div>
  );
}

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

// ─── Template 1: Gradient + Confetti + Rings ───
function Template1({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-accent-600 to-pink-500 text-white cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      <Confetti />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="splash-ring absolute w-48 h-48 rounded-full border-2 border-white/20" />
        <div className="splash-ring absolute w-72 h-72 rounded-full border border-white/10" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="splash-sub relative z-10 mb-6" style={{ animationDelay: '0.15s' }}>
        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
        </div>
      </div>
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-white/70 text-sm font-medium mb-2 tracking-widest uppercase" style={{ animationDelay: '0.3s' }}>Welcome, {firstName}</p>
        <AnimatedWord word="Marketplace" />
        <p className="splash-sub text-white/50 text-xs mt-4" style={{ animationDelay: '1.2s' }}>Buy · Sell · Launch · Discover</p>
      </div>
      <div className="splash-sub absolute bottom-10 text-white/30 text-xs" style={{ animationDelay: '2s' }}>Tap to enter</div>
    </div>
  );
}

// ─── Template 2: Dark Neon Glow ───
function Template2({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950 text-white cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      <div className="absolute inset-0 splash-grid" style={{ backgroundImage: 'linear-gradient(hsla(270,80%,60%,0.08) 1px, transparent 1px), linear-gradient(90deg, hsla(270,80%,60%,0.08) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="splash-sub relative z-10 mb-6" style={{ animationDelay: '0.15s' }}>
        <div className="w-20 h-20 rounded-2xl border-2 border-purple-500/50 bg-purple-500/10 flex items-center justify-center splash-glow-border">
          <svg className="w-10 h-10 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
        </div>
      </div>
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-purple-300/60 text-sm font-medium mb-2 tracking-widest uppercase" style={{ animationDelay: '0.3s' }}>Welcome, {firstName}</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 splash-neon text-purple-300">Marketplace</h1>
        <p className="splash-sub text-purple-300/40 text-xs mt-4" style={{ animationDelay: '1.2s' }}>Buy · Sell · Launch · Discover</p>
      </div>
      <div className="splash-sub absolute bottom-10 text-purple-300/20 text-xs" style={{ animationDelay: '2s' }}>Tap to enter</div>
    </div>
  );
}

// ─── Template 3: Split Slide ───
function Template3({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      <div className="w-1/2 h-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center" style={{ animation: 'splash-slide-left 0.6s ease-out forwards' }}>
        <svg className="w-16 h-16 text-white/80 splash-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
      </div>
      <div className="w-1/2 h-full bg-gray-950 flex flex-col items-center justify-center text-white" style={{ animation: 'splash-slide-right 0.6s ease-out forwards' }}>
        <p className="splash-sub text-white/50 text-xs mb-2 tracking-widest uppercase" style={{ animationDelay: '0.4s' }}>Welcome, {firstName}</p>
        <AnimatedWord word="Market" delay={0.5} />
        <h2 className="text-2xl font-bold text-purple-400 splash-sub" style={{ animationDelay: '0.9s' }}>place</h2>
        <p className="splash-sub text-white/30 text-xs mt-4" style={{ animationDelay: '1.3s' }}>Buy · Sell · Launch</p>
      </div>
    </div>
  );
}

// ─── Template 4: Emoji Burst ───
function Template4({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  const emojis = useMemo(() => ['🛒', '🚀', '⭐', '💻', '🎨', '📦', '🔥', '💎', '🛠️', '🎯'], []);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-t from-indigo-900 via-purple-800 to-pink-600 text-white cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      {emojis.map((e, i) => (
        <div key={i} className="absolute text-2xl splash-float" style={{
          left: `${10 + (i * 8) % 80}%`, top: `${10 + (i * 13) % 70}%`,
          animationDelay: `${i * 0.2}s`, animationDuration: `${2 + (i % 3) * 0.5}s`,
          opacity: 0, animation: `splash-icon-pop 0.5s ${0.1 + i * 0.08}s ease-out forwards, splash-float ${2 + (i % 3) * 0.5}s ${0.6 + i * 0.08}s ease-in-out infinite`,
        }}>{e}</div>
      ))}
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-white/60 text-sm mb-2 tracking-widest uppercase" style={{ animationDelay: '0.3s' }}>Welcome, {firstName}</p>
        <AnimatedWord word="Marketplace" delay={0.45} />
        <p className="splash-sub text-white/40 text-xs mt-4" style={{ animationDelay: '1.3s' }}>Your digital storefront awaits</p>
      </div>
      <div className="splash-sub absolute bottom-10 text-white/25 text-xs" style={{ animationDelay: '2s' }}>Tap to enter</div>
    </div>
  );
}

// ─── Template 5: Shimmer Gradient ───
function Template5({ firstName, onDone }: { firstName: string; onDone: () => void }) {
  const [exiting, setExiting] = useState(false);
  useEffect(() => { const t = setTimeout(() => { setExiting(true); setTimeout(onDone, 350); }, 3200); return () => clearTimeout(t); }, [onDone]);
  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 splash-bg-pan text-white cursor-pointer splash-screen${exiting ? ' exiting' : ''}`} onClick={() => { setExiting(true); setTimeout(onDone, 350); }}>
      <Confetti count={15} />
      <div className="splash-sub relative z-10 mb-6" style={{ animationDelay: '0.15s' }}>
        <div className="w-20 h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center splash-bounce-in">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/></svg>
        </div>
      </div>
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-white/70 text-sm font-medium mb-2 tracking-widest uppercase" style={{ animationDelay: '0.3s' }}>Welcome, {firstName}</p>
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3 splash-shimmer-text">Marketplace</h1>
        <p className="splash-sub text-white/50 text-xs mt-4" style={{ animationDelay: '1.2s' }}>Buy · Sell · Launch · Discover</p>
      </div>
      <div className="splash-sub absolute bottom-10 text-white/30 text-xs" style={{ animationDelay: '2s' }}>Tap to enter</div>
    </div>
  );
}

const TEMPLATES = [Template1, Template2, Template3, Template4, Template5];

export function MarketplaceSplash({ onDone }: { onDone: () => void }) {
  const user = useBoard((s) => s.user);
  const [Template] = useState(() => TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)]);
  const firstName = (user?.fullName || user?.name || 'there').split(' ')[0];

  return <Template firstName={firstName} onDone={onDone} />;
}
