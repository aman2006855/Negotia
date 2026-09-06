'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBoard } from '@/lib/store';
import { BriefcaseIcon, StoreIcon } from './icons';

const MARKETPLACE_ROUTES = ['/marketplace', '/launches', '/leaderboard', '/my-store'];

export function TopHeader() {
  const pathname = usePathname();
  const user = useBoard((s) => s.user);
  const theme = useBoard((s) => s.theme);
  const toggleTheme = useBoard((s) => s.toggleTheme);

  const isMarketplace = MARKETPLACE_ROUTES.some((r) => pathname.startsWith(r));

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-surface/95 backdrop-blur-lg dark:bg-surface/90">
      <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4">
        {/* Logo — toggles between Jobs and Marketplace */}
        <Link href={isMarketplace ? '/jobs' : '/marketplace'} className="flex items-center gap-2">
          <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-soft transition-colors duration-300 ${
            isMarketplace ? 'bg-purple-600' : 'bg-accent-600'
          }`}>
            {isMarketplace ? (
              <StoreIcon className="h-4 w-4" />
            ) : (
              <BriefcaseIcon className="h-4 w-4" />
            )}
          </span>
          <span className="text-base font-bold tracking-tight text-txt-primary">Negotia</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full transition-colors duration-300 ${
            isMarketplace
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300'
              : 'bg-accent-100 text-accent-700 dark:bg-accent-500/20 dark:text-accent-300'
          }`}>
            {isMarketplace ? 'Store' : 'Jobs'}
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Toggle button — opposite of current view, with shine+blink when on Jobs */}
          <Link
            href={isMarketplace ? '/jobs' : '/marketplace'}
            className={`relative flex items-center gap-1.5 rounded-xl transition-all duration-200 ${
              !isMarketplace
                ? 'h-9 px-3 nav-shine-btn text-accent-600 dark:text-accent-400 font-semibold text-xs'
                : 'h-9 px-3 text-txt-secondary hover:bg-inset hover:text-txt-primary font-semibold text-xs'
            }`}
            aria-label={isMarketplace ? 'Switch to Jobs' : 'Switch to Marketplace'}
          >
            {isMarketplace ? (
              <>
                <BriefcaseIcon className="h-[18px] w-[18px]" />
                <span className="hidden sm:inline">Jobs</span>
              </>
            ) : (
              <>
                <StoreIcon className="h-[18px] w-[18px]" />
                <span className="hidden sm:inline">Store</span>
                <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[8px] font-bold text-white shadow-md animate-bounce">
                  NEW
                </span>
              </>
            )}
          </Link>

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
          {user?.name || user?.avatar ? (
            <Link href="/profile" className="flex items-center gap-2">
              <span className="text-xs text-txt-secondary hidden sm:inline">{user.fullName || user.name}</span>
              {user.avatar ? (
                <img src={user.avatar} alt={user.fullName || user.name || 'Profile'}
                  className="h-7 w-7 rounded-full object-cover ring-2 ring-surface dark:ring-surface" />
              ) : (
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-50 text-[11px] font-bold text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">
                  {(user.fullName || user.name || 'U').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              )}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
