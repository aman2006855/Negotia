import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Negotia — 1-on-1 Freelance Job Board',
  description: 'Click a job. Lock it. Negotiate 1-on-1. Build amazing things together.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
