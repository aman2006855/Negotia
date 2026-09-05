'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBoard } from '@/lib/store';
import { signOut } from '@/lib/supabase';
import { destroySocket } from '@/lib/socket';
import { LogOutIcon, BriefcaseIcon, BarChartIcon, FolderIcon, MenuIcon, XIcon } from './icons';
import { useState } from 'react';

export function Header() {
  const router = useRouter();
  const user = useBoard((s) => s.user);
  const logout = useBoard((s) => s.logout);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await signOut();
    destroySocket();
    logout();
    router.push('/login');
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-txt-primary">
          <BriefcaseIcon className="h-5 w-5 text-accent-600" />
          <span className="text-lg tracking-tight">Negotia</span>
        </Link>

        {user && (
          <>
            <nav className="hidden md:flex items-center gap-1">
              <Link href="/" className="btn-ghost text-sm">
                <FolderIcon className="h-4 w-4" /> Board
              </Link>
              {user.role === 'CLIENT' && (
                <>
                  <Link href="/dashboard" className="btn-ghost text-sm">
                    <BarChartIcon className="h-4 w-4" /> Dashboard
                  </Link>
                  <Link href="/post" className="btn-primary text-sm py-1.5">
                    Post Job
                  </Link>
                </>
              )}
              {user.role === 'FREELANCER' && (
                <Link href="/freelancer" className="btn-ghost text-sm">
                  <BarChartIcon className="h-4 w-4" /> Dashboard
                </Link>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-txt-secondary">{user.name}</span>
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">
                  {user.role}
                </span>
              </div>
              <button onClick={handleLogout}
                className="rounded-md p-1.5 text-txt-tertiary transition hover:bg-inset hover:text-txt-primary"
                aria-label="Logout">
                <LogOutIcon className="h-4 w-4" />
              </button>
            </div>

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-md p-1.5 text-txt-tertiary hover:bg-inset">
              {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </>
        )}
      </div>

      {mobileMenuOpen && user && (
        <div className="md:hidden border-t border-border-subtle bg-surface animate-fade-in">
          <div className="px-4 py-3 space-y-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-txt-secondary hover:bg-inset">
              <FolderIcon className="h-4 w-4" /> Board
            </Link>
            {user.role === 'CLIENT' && (
              <>
                <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-txt-secondary hover:bg-inset">
                  <BarChartIcon className="h-4 w-4" /> Dashboard
                </Link>
                <Link href="/post" onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent-600 font-medium hover:bg-accent-50">
                  <BriefcaseIcon className="h-4 w-4" /> Post Job
                </Link>
              </>
            )}
            {user.role === 'FREELANCER' && (
              <Link href="/freelancer" onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-txt-secondary hover:bg-inset">
                <BarChartIcon className="h-4 w-4" /> Dashboard
              </Link>
            )}
            <div className="border-t border-border-subtle pt-2 mt-2">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm text-txt-secondary">{user.name}</span>
                <span className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700">{user.role}</span>
              </div>
              <button onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-danger-600 hover:bg-danger-50">
                <LogOutIcon className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
