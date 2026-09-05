'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopHeader } from '@/components/TopHeader';
import { TopBanner } from '@/components/TopBanner';
import { BottomNav } from '@/components/BottomNav';
import { Toast } from '@/components/Toast';
import { api } from '@/lib/api';
import { useBoard } from '@/lib/store';
import { getSession } from '@/lib/supabase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const setUser = useBoard((s) => s.setUser);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.replace('/login');
        return;
      }
      return api.me().then((me) => {
        setUser(me.user);
        if (!me.user) {
          router.replace('/login');
        } else if (!me.user.profileCompleted) {
          router.replace('/signup?step=role');
        }
      });
    }).catch(() => {
      router.replace('/login');
    }).finally(() => {
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <TopHeader />
      <div className="pt-12">
        <TopBanner />
        <main className="pb-20">{children}</main>
      </div>
      <BottomNav />
      <Toast />
    </div>
  );
}
