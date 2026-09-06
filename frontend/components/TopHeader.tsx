'use client';

import Link from 'next/link';
import { useBoard } from '@/lib/store';
import { BriefcaseIcon } from './icons';

export function TopHeader() {
  const user = useBoard((s) => s.user);
  const theme = useBoard((s) => s.theme);
  const toggleTheme = useBoard((s) => s.toggleTheme);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-surface/95 backdrop-blur-lg dark:bg-surface/90">
      <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4">
        <Link href="/jobs" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-white shadow-soft">
            <BriefcaseIcon className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-txt-primary">Negotia</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="relative flex h-8 w-8 items-center justify-center rounded-xl text-txt-secondary hover:bg-inset hover:text-txt-primary transition-all duration-300"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className={`absolute transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`}>
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </span>
            <span className={`absolute transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${theme === 'dark' ? '-rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}>
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </span>
          </button>

          {/* User Avatar */}
          {user && (
            <Link href="/profile" className="flex items-center gap-2">
              <span className="text-xs text-txt-secondary hidden sm:inline">{user.name}</span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-50 text-xs font-bold text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">
                {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
