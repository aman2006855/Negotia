'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { TopHeader } from '@/components/TopHeader';
import { TopBanner } from '@/components/TopBanner';
import { BottomNav } from '@/components/BottomNav';
import { Toast } from '@/components/Toast';
import { MarketplaceSplash } from '@/components/marketplace/MarketplaceSplash';
import { JobsSplash } from '@/components/JobsSplash';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';

const MARKETPLACE_ROUTES = ['/marketplace', '/launches', '/leaderboard', '/my-store'];

function getSection(pathname: string): 'jobs' | 'marketplace' {
  if (MARKETPLACE_ROUTES.some((r) => pathname.startsWith(r))) return 'marketplace';
  return 'jobs';
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const setUser = useBoard((s) => s.setUser);
  const acquireLock = useBoard((s) => s.acquireLock);
  const [loaded, setLoaded] = useState(false);
  const [splash, setSplash] = useState<'jobs' | 'marketplace' | null>(null);
  const prevSection = useRef<'jobs' | 'marketplace'>(getSection(pathname));
  const initialized = useRef(false);

  useEffect(() => {
    api.me().then((me) => {
      if (me.user) setUser(me.user);
      if (me.activeJob) acquireLock(me.activeJob.jobId, me.activeJob.negotiationId);
    }).catch(() => {}).finally(() => setLoaded(true));
  }, []);

  // Only show splash when SECTION changes (jobs ↔ marketplace), not within same section
  useEffect(() => {
    const currentSection = getSection(pathname);

    // Skip first render
    if (!initialized.current) {
      initialized.current = true;
      prevSection.current = currentSection;
      return;
    }

    if (currentSection !== prevSection.current) {
      prevSection.current = currentSection;
      setSplash(currentSection);
    }
  }, [pathname]);

  const dismissSplash = useCallback(() => setSplash(null), []);

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-canvas flex flex-col">
      <TopHeader />
      <div className="flex-1 flex flex-col overflow-hidden pt-12">
        <TopBanner />
        <main className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col pb-20">{children}</main>
      </div>
      <BottomNav />
      <Toast />
      {splash === 'marketplace' && <MarketplaceSplash onDone={dismissSplash} />}
      {splash === 'jobs' && <JobsSplash onDone={dismissSplash} />}
    </div>
  );
}
