'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useBoard } from '@/lib/store';
import { BriefcaseIcon, MessageIcon, FolderIcon, BarChartIcon, UserIcon, PlusIcon, StoreIcon, LaunchIcon, TrophyIcon } from './icons';

const FREELANCER_TABS = [
  { href: '/jobs', label: 'Jobs', icon: BriefcaseIcon },
  { href: '/negotiation', label: 'Negotiate', icon: MessageIcon },
  { href: '/workspace', label: 'Workspace', icon: FolderIcon },
  { href: '/dashboard', label: 'Dashboard', icon: BarChartIcon },
  { href: '/profile', label: 'Profile', icon: UserIcon },
] as const;

const CLIENT_TABS = [
  { href: '/my-postings', label: 'My Posts', icon: BriefcaseIcon },
  { href: '/negotiation', label: 'Negotiate', icon: MessageIcon },
  { href: '/post', label: 'Post Job', icon: PlusIcon, isCenter: true },
  { href: '/workspace', label: 'Workspace', icon: FolderIcon },
  { href: '/dashboard', label: 'Dashboard', icon: BarChartIcon },
  { href: '/profile', label: 'Profile', icon: UserIcon },
] as const;

const MARKETPLACE_ROUTES = ['/marketplace', '/launches', '/leaderboard', '/my-store'];

export function BottomNav() {
  const pathname = usePathname();
  const user = useBoard((s) => s.user);
  const myActiveJobId = useBoard((s) => s.myActiveJobId);

  const isMarketplace = MARKETPLACE_ROUTES.some((r) => pathname.startsWith(r));

  const tabs = isMarketplace
    ? null // handled separately below
    : user?.role === 'CLIENT'
      ? CLIENT_TABS
      : FREELANCER_TABS;

  function isActive(href: string) {
    if (href === '/jobs') return pathname === '/jobs' || pathname === '/';
    return pathname.startsWith(href);
  }

  // Marketplace always shows both Sell + Launch buttons
  if (isMarketplace) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface/95 backdrop-blur-lg dark:bg-surface/90 dark:shadow-nav-dark shadow-nav">
        <div className="mx-auto flex max-w-lg items-center justify-between px-3 pb-[env(safe-area-inset-bottom)]">
          {/* Store */}
          <Link href="/marketplace" className={`flex flex-col items-center gap-0.5 py-2 px-2 transition-all duration-200 ${isActive('/marketplace') ? 'text-accent-600 dark:text-accent-400' : 'text-txt-tertiary hover:text-txt-secondary'}`}>
            <StoreIcon className="h-5 w-5" />
            <span className="text-[10px] font-medium">Store</span>
            {isActive('/marketplace') && <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-accent-600 dark:bg-accent-400" />}
          </Link>

          {/* Launches */}
          <Link href="/launches" className={`flex flex-col items-center gap-0.5 py-2 px-2 transition-all duration-200 ${isActive('/launches') && !isActive('/launches/new') ? 'text-purple-600 dark:text-purple-400' : 'text-txt-tertiary hover:text-txt-secondary'}`}>
            <LaunchIcon className="h-5 w-5" />
            <span className="text-[10px] font-medium">Launches</span>
            {isActive('/launches') && !isActive('/launches/new') && <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-purple-600 dark:bg-purple-400" />}
          </Link>

          {/* ＋ Sell (center-left) */}
          <Link href="/marketplace/new" className="flex flex-col items-center gap-0.5 py-1 px-1.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-600 text-white shadow-medium hover:bg-accent-500 transition-all -mt-3">
              <PlusIcon className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-semibold text-accent-600 dark:text-accent-400">Sell</span>
          </Link>

          {/* 🚀 Launch (center-right) */}
          <Link href="/launches/new" className="flex flex-col items-center gap-0.5 py-1 px-1.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white shadow-medium hover:bg-purple-500 transition-all -mt-3">
              <LaunchIcon className="h-5 w-5" />
            </span>
            <span className="text-[9px] font-semibold text-purple-600 dark:text-purple-400">Launch</span>
          </Link>

          {/* Leaderboard */}
          <Link href="/leaderboard" className={`flex flex-col items-center gap-0.5 py-2 px-2 transition-all duration-200 ${isActive('/leaderboard') ? 'text-accent-600 dark:text-accent-400' : 'text-txt-tertiary hover:text-txt-secondary'}`}>
            <TrophyIcon className="h-5 w-5" />
            <span className="text-[10px] font-medium">Rank</span>
            {isActive('/leaderboard') && <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-accent-600 dark:bg-accent-400" />}
          </Link>

          {/* My Store */}
          <Link href="/my-store" className={`flex flex-col items-center gap-0.5 py-2 px-2 transition-all duration-200 ${isActive('/my-store') ? 'text-accent-600 dark:text-accent-400' : 'text-txt-tertiary hover:text-txt-secondary'}`}>
            <UserIcon className="h-5 w-5" />
            <span className="text-[10px] font-medium">Store</span>
            {isActive('/my-store') && <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-accent-600 dark:bg-accent-400" />}
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface/95 backdrop-blur-lg dark:bg-surface/90 dark:shadow-nav-dark shadow-nav">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs!.map((tab) => {
          const active = isActive(tab.href);
          const isCenter = 'isCenter' in tab && tab.isCenter;
          const Icon = tab.icon;

          if (isCenter) {
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="relative flex flex-col items-center gap-0.5 py-2 px-3 transition-all duration-200"
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-full transition-all duration-200 -mt-4 ${
                  active
                    ? 'bg-accent-600 text-white shadow-medium scale-105'
                    : 'bg-accent-50 text-accent-600 hover:bg-accent-100 dark:bg-accent-50/20 dark:text-accent-400 dark:hover:bg-accent-50/30'
                }`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`text-[10px] font-medium transition-colors ${
                  active ? 'text-accent-600 dark:text-accent-400' : 'text-txt-tertiary'
                }`}>{tab.label}</span>
                {user?.role === 'FREELANCER' && myActiveJobId && (
                  <span className="absolute top-1.5 right-1 h-2 w-2 rounded-full bg-success-500 animate-pulse" />
                )}
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-3 transition-all duration-200 ${
                active ? 'text-accent-600 dark:text-accent-400' : 'text-txt-tertiary hover:text-txt-secondary'
              }`}
            >
              <Icon className="h-5 w-5 transition-transform duration-200" />
              <span className="text-[10px] font-medium">{tab.label}</span>
              {active && (
                <span className="absolute bottom-0 h-0.5 w-5 rounded-full bg-accent-600 dark:bg-accent-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
