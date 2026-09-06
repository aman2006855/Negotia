import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/jobs';
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    console.error('OAuth error:', error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDescription ?? error)}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = createClient();

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Code exchange error:', exchangeError.message);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(exchangeError.message)}`);
  }

  const user = data.user;
  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=no_user`);
  }

  // Check public.users — auto-create if missing
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, profile_completed, username, role, entity_type')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking users table:', fetchError.message);
  }

  function getIncompleteStep(u: { username?: string; role?: string; entity_type?: string; profile_completed: boolean }): string {
    if (u.profile_completed) return '';
    if (!u.username) return 'username';
    if (!u.role) return 'role';
    if (!u.entity_type) return 'entity';
    return 'profile';
  }

  if (!existingUser) {
    const meta = user.user_metadata ?? {};
    const name = meta.name ?? meta.full_name ?? user.email?.split('@')[0] ?? 'User';
    const fullName = meta.full_name ?? meta.name ?? null;
    const avatar = meta.avatar_url ?? meta.picture ?? null;

    const { error: insertError } = await supabase.from('users').upsert({
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

    if (insertError) {
      console.error('Error creating user row:', insertError.message);
    }

    return NextResponse.redirect(`${origin}/signup?step=username`);
  }

  // Find first incomplete step
  const step = getIncompleteStep(existingUser);
  if (step) {
    return NextResponse.redirect(`${origin}/signup?step=${step}`);
  }

  // Profile complete — redirect to requested page or /jobs
  return NextResponse.redirect(`${origin}${next}`);
}
