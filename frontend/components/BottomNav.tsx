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

const MARKETPLACE_TABS = [
  { href: '/marketplace', label: 'Store', icon: StoreIcon },
  { href: '/launches', label: 'Launches', icon: LaunchIcon },
  { href: '/marketplace/new', label: 'Sell', icon: PlusIcon, isCenter: true },
  { href: '/leaderboard', label: 'Leaderboard', icon: TrophyIcon },
  { href: '/my-store', label: 'My Store', icon: UserIcon },
] as const;

const MARKETPLACE_ROUTES = ['/marketplace', '/launches', '/leaderboard', '/my-store'];

export function BottomNav() {
  const pathname = usePathname();
  const user = useBoard((s) => s.user);
  const myActiveJobId = useBoard((s) => s.myActiveJobId);

  const isMarketplace = MARKETPLACE_ROUTES.some((r) => pathname.startsWith(r));

  const tabs = isMarketplace
    ? MARKETPLACE_TABS
    : user?.role === 'CLIENT'
      ? CLIENT_TABS
      : FREELANCER_TABS;

  function isActive(href: string) {
    if (href === '/jobs') return pathname === '/jobs' || pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-subtle bg-surface/95 backdrop-blur-lg dark:bg-surface/90 dark:shadow-nav-dark shadow-nav">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
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
                {!isMarketplace && user?.role === 'FREELANCER' && myActiveJobId && (
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
