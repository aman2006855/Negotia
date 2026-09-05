'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSession } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    getSession().then(async (session) => {
      if (!session) {
        router.replace('/login');
        return;
      }
      const { data } = await supabase.from('users').select('profile_completed').eq('id', session.user.id).maybeSingle();
      if (data?.profile_completed) {
        router.replace('/jobs');
      } else {
        router.replace('/signup?step=role');
      }
    }).catch(() => {
      router.replace('/login');
    });
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
    </div>
  );
}
