import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Negotia — 1-on-1 Freelance Job Board',
  description: 'Click a job. Lock it. Negotiate 1-on-1. Build amazing things together.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('negotia_theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen antialiased" style={{ fontFamily: "'Inter','DM Sans',system-ui,-apple-system,sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
