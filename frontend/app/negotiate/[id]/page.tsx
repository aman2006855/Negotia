'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function NegotiateRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace('/negotiation'); }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-600 border-t-transparent" />
    </div>
  );
}
