import { type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

const protectedRoutes = ['/jobs', '/profile', '/workspace', '/dashboard'];
const authRoutes = ['/login', '/signup'];
const publicRoutes = ['/', '/auth/callback', '/api'];

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

function isAuthRoute(pathname: string): boolean {
  return authRoutes.some((route) => pathname.startsWith(route));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public/static routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return;
  }

  // Only apply auth guard to protected routes
  if (!isProtectedRoute(pathname)) {
    return;
  }

  const supabase = createClient(request);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. No session -> /login
  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    return Response.redirect(loginUrl);
  }

  // 2. Check public.users — auto-create if missing
  const { data: existingUser } = await supabase
    .from('users')
    .select('id, profile_completed, username')
    .eq('id', user.id)
    .maybeSingle();

  if (!existingUser) {
    const meta = user.user_metadata ?? {};
    const name = meta.name ?? meta.full_name ?? user.email?.split('@')[0] ?? 'User';
    const fullName = meta.full_name ?? meta.name ?? null;
    const avatar = meta.avatar_url ?? meta.picture ?? null;

    await supabase.from('users').upsert({
      id: user.id,
      email: user.email ?? '',
      name,
      full_name: fullName,
      avatar_url: avatar,
      role: 'FREELANCER',
      skills: [],
      portfolio_links: [],
      past_work: [],
      total_earnings_cents: 0,
      completed_jobs: 0,
      active_jobs: 0,
      rating: 0,
      review_count: 0,
      profile_completed: false,
    }, { onConflict: 'id' });

    const signupUrl = request.nextUrl.clone();
    signupUrl.pathname = '/signup';
    signupUrl.searchParams.set('step', 'username');
    return Response.redirect(signupUrl);
  }

  // 3. No username set -> force username step
  if (!existingUser.username) {
    const signupUrl = request.nextUrl.clone();
    signupUrl.pathname = '/signup';
    signupUrl.searchParams.set('step', 'username');
    return Response.redirect(signupUrl);
  }

  // 4. profile_completed = false -> /signup?step=role
  if (!existingUser.profile_completed) {
    const signupUrl = request.nextUrl.clone();
    signupUrl.pathname = '/signup';
    signupUrl.searchParams.set('step', 'role');
    return Response.redirect(signupUrl);
  }

  // 4. All good — allow through
  return;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
