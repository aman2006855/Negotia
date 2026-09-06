'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { StoreIcon, LaunchIcon, PlusIcon, TrophyIcon, UserIcon } from '../icons';

const TABS = [
  { label: 'Store', href: '/marketplace', icon: StoreIcon },
  { label: 'Launches', href: '/launches', icon: LaunchIcon },
  { label: 'Add', href: '/marketplace/new', icon: PlusIcon },
  { label: 'Leaderboard', href: '/leaderboard', icon: TrophyIcon },
  { label: 'My Store', href: '/my-store', icon: UserIcon },
] as const;

export function MarketplaceTabs() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-b bg-surface">
      <div className="flex overflow-x-auto no-scrollbar -mx-4 px-4 gap-1" style={{ scrollbarWidth: 'none' }}>
        {TABS.map((tab) => {
          const active = tab.href === '/marketplace'
            ? pathname === '/marketplace'
            : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                active
                  ? 'text-accent-600 dark:text-accent-400 border-b-2 border-accent-500'
                  : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
