'use client';

import Link from 'next/link';
import { useBoard } from '@/lib/store';
import { BriefcaseIcon } from './icons';

export function TopHeader() {
  const user = useBoard((s) => s.user);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border-subtle bg-surface/95 backdrop-blur-lg dark:bg-surface/90">
      <div className="mx-auto flex h-12 max-w-2xl items-center justify-between px-4">
        <Link href="/jobs" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-600 text-white shadow-soft">
            <BriefcaseIcon className="h-4 w-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-txt-primary">Negotia</span>
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-txt-secondary hidden sm:inline">{user.name}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-50 text-xs font-bold text-accent-700 dark:bg-accent-50/20 dark:text-accent-400">
              {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
