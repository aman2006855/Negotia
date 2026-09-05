import type { Metadata } from 'next';
import { TopHeader } from '@/components/TopHeader';
import { TopBanner } from '@/components/TopBanner';
import { BottomNav } from '@/components/BottomNav';
import { Toast } from '@/components/Toast';

export const metadata: Metadata = {
  title: 'Negotia — 1-on-1 Freelance Job Board',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
