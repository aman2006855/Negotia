'use client';

import { useEffect, useState, useMemo } from 'react';
import { useBoard } from '@/lib/store';

const WORDS = ['Marketplace', 'Showcase', 'Launches'];
const COLORS = ['#a855f7', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function Confetti() {
  const pieces = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 1.5,
      duration: 2 + Math.random() * 2,
      size: 5 + Math.random() * 6,
    })), []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="splash-confetti"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function MarketplaceSplash() {
  const user = useBoard((s) => s.user);
  const [show, setShow] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const seen = sessionStorage.getItem('negotia_marketplace_splash');
    if (!seen) {
      setShow(true);
      sessionStorage.setItem('negotia_marketplace_splash', '1');
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      setExiting(true);
      setTimeout(() => setShow(false), 400);
    }, 3500);
    return () => clearTimeout(t);
  }, [show]);

  useEffect(() => {
    if (!show) return;
    const interval = setInterval(() => {
      setWordIndex((i) => (i + 1) % WORDS.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  const firstName = (user?.fullName || user?.name || 'there').split(' ')[0];
  const currentWord = WORDS[wordIndex];

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-accent-600 to-pink-500 text-white ${exiting ? 'exiting splash-screen' : 'splash-screen'}`}
      onClick={() => { setExiting(true); setTimeout(() => setShow(false), 400); }}
    >
      <Confetti />

      {/* Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="splash-ring absolute w-48 h-48 rounded-full border-2 border-white/20" />
        <div className="splash-ring absolute w-72 h-72 rounded-full border border-white/10" style={{ animationDelay: '0.5s' }} />
        <div className="splash-ring absolute w-96 h-96 rounded-full border border-white/5" style={{ animationDelay: '1s' }} />
      </div>

      {/* Icon */}
      <div className="splash-sub relative z-10 mb-6" style={{ animationDelay: '0.2s' }}>
        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
            <path d="M2 7h20" />
          </svg>
        </div>
      </div>

      {/* Greeting */}
      <div className="relative z-10 text-center px-6">
        <p className="splash-sub text-white/70 text-sm font-medium mb-2 tracking-widest uppercase" style={{ animationDelay: '0.4s' }}>
          Welcome, {firstName}
        </p>

        {/* Animated word */}
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-3" style={{ perspective: '600px' }}>
          {currentWord.split('').map((ch, i) => (
            <span key={`${wordIndex}-${i}`} className="splash-letter" style={{ animationDelay: `${0.5 + i * 0.04}s` }}>
              {ch === ' ' ? '\u00A0' : ch}
            </span>
          ))}
        </h1>

        <p className="splash-sub text-white/60 text-sm mt-4" style={{ animationDelay: '1.2s' }}>
          Buy · Sell · Launch · Discover
        </p>
      </div>

      {/* Tap to continue */}
      <div className="splash-sub absolute bottom-12 text-white/40 text-xs tracking-wide" style={{ animationDelay: '2s' }}>
        Tap anywhere to continue
      </div>
    </div>
  );
}
