import type { FeedJob, Me, NegotiationState, User, Project, Review, DashboardStats, ChatMessage } from './types';
import { supabase, signInWithEmail, signUpWithEmail, signInWithGoogle as sbGoogle, getSession } from './supabase';

function mapUser(u: any): User {
  return {
    id: u.id, name: u.name, fullName: u.full_name ?? u.name, username: u.username,
    email: u.email, role: u.role,
    avatar: u.avatar_url, coverPhotoUrl: u.cover_photo_url,
    socialLinks: u.social_links ?? {},
    skills: u.skills ?? [],
    entityType: u.entity_type, companyName: u.company_name,
    industry: u.industry, companySize: u.company_size,
    budgetRange: u.budget_range, workStyle: u.work_style,
    capabilities: u.capabilities, about: u.about, experience: u.experience,
    portfolioLinks: u.portfolio_links ?? [], pastWork: u.past_work ?? [],
    totalEarningsCents: u.total_earnings_cents ?? 0,
    completedJobs: u.completed_jobs ?? 0, activeJobs: u.active_jobs ?? 0,
    rating: Number(u.rating) || 0, reviewCount: u.review_count ?? 0,
    createdAt: u.created_at,
    profileCompleted: u.profile_completed ?? false,
  } as User;
}

function mapFeedJob(j: any): FeedJob {
  return {
    id: j.id, title: j.title, description: j.description,
    budgetCents: j.budget_cents, category: j.category ?? 'All', status: j.status,
    lockedAt: j.locked_at ?? null, createdAt: j.created_at,
    clientId: j.client_id, clientName: j.client_name ?? j.clientName ?? 'Client',
    freelancerId: j.freelancer_id, freelancerName: j.freelancer_name ?? j.freelancerName,
    currency: j.currency ?? 'USD',
  };
}

function mapMilestone(m: any) {
  return { id: m.id, title: m.title, status: m.status, sortOrder: m.sort_order ?? 0, createdAt: m.created_at ?? new Date().toISOString() };
}

export const api = {
  login: async (email: string, password: string): Promise<Me> => {
    await signInWithEmail(email, password);
    return api.me();
  },

  googleLogin: async () => {
    return sbGoogle();
  },

  signup: async (d: { name: string; email: string; password: string }): Promise<Me> => {
    const result = await signUpWithEmail(d.email, d.password, d.name);
    if (result.session) return api.me();
    return { user: mapUser({ id: result.user?.id ?? '', name: d.name, email: d.email, role: 'FREELANCER', skills: [], portfolio_links: [], past_work: [], total_earnings_cents: 0, completed_jobs: 0, active_jobs: 0, rating: 0, review_count: 0, created_at: new Date().toISOString() }), activeJob: null };
  },

  updateProfile: async (data: Partial<User>): Promise<Me> => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.fullName !== undefined) updateData.full_name = data.fullName;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.avatar !== undefined) updateData.avatar_url = data.avatar;
    if (data.coverPhotoUrl !== undefined) updateData.cover_photo_url = data.coverPhotoUrl;
    if (data.socialLinks !== undefined) updateData.social_links = data.socialLinks;
    if (data.entityType !== undefined) updateData.entity_type = data.entityType;
    if (data.companyName !== undefined) updateData.company_name = data.companyName;
    if (data.industry !== undefined) updateData.industry = data.industry;
    if (data.companySize !== undefined) updateData.company_size = data.companySize;
    if (data.budgetRange !== undefined) updateData.budget_range = data.budgetRange;
    if (data.workStyle !== undefined) updateData.work_style = data.workStyle;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.capabilities !== undefined) updateData.capabilities = data.capabilities;
    if (data.about !== undefined) updateData.about = data.about;
    if (data.experience !== undefined) updateData.experience = data.experience;
    if (data.portfolioLinks !== undefined) updateData.portfolio_links = data.portfolioLinks;
    if (data.pastWork !== undefined) updateData.past_work = data.pastWork;
    if ((data as any).profileCompleted !== undefined) {
      updateData.profile_completed = (data as any).profileCompleted;
    }
    const { error } = await supabase.from('users').update(updateData).eq('id', session.user.id);
    if (error) {
      console.error('updateProfile error:', error.message, error.details, error.hint);
      throw error;
    }
    return api.me();
  },

  checkUsername: async (username: string): Promise<{ available: boolean }> => {
    const clean = username.toLowerCase().trim();
    if (!clean || clean.length < 3) return { available: false };
    const { data } = await supabase.from('users').select('id').eq('username', clean).maybeSingle();
    return { available: !data };
  },

  lockJob: async (jobId: string): Promise<{ ok: boolean; negotiationId?: string; error?: string }> => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase.rpc('lock_job', {
      p_job_id: jobId,
      p_freelancer_id: session.user.id,
    });
    if (error) {
      console.error('lockJob RPC error:', error.message, error.details, error.hint);
      throw error;
    }
    const result = data as any;
    if (!result?.ok) {
      return { ok: false, error: result?.error ?? 'UNKNOWN' };
    }
    return { ok: true, negotiationId: result.negotiation_id };
  },

  me: async (): Promise<Me> => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    let { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();
    if (!data) {
      const meta = session.user.user_metadata ?? {};
      const name = meta.name ?? meta.full_name ?? meta.avatar_url?.split('/').pop() ?? session.user.email?.split('@')[0] ?? 'User';
      const avatar = meta.avatar_url ?? meta.picture ?? null;
      const { error: insErr } = await supabase.from('users').upsert({
        id: session.user.id, email: session.user.email ?? '', name, avatar_url: avatar,
        role: 'FREELANCER', skills: [], portfolio_links: [], past_work: [],
        total_earnings_cents: 0, completed_jobs: 0, active_jobs: 0,
        rating: 0, review_count: 0, profile_completed: false,
      }, { onConflict: 'id' });
      if (insErr) throw insErr;
      ({ data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle());
    }
    if (error) throw error;
    const user = mapUser(data);
    const { data: myJobs } = await supabase.from('jobs').select('status').eq('client_id', session.user.id);
    const allMyJobs = myJobs ?? [];
    user.completedJobs = allMyJobs.filter((j: any) => j.status === 'COMPLETED').length;
    user.activeJobs = allMyJobs.filter((j: any) => j.status === 'OPEN' || j.status === 'NEGOTIATING').length;
    const { data: neg } = await supabase
      .from('negotiations')
      .select('id, job_id')
      .or(`client_id.eq.${session.user.id},freelancer_id.eq.${session.user.id}`)
      .is('outcome', null)
      .limit(1)
      .maybeSingle();
    return { user, activeJob: neg ? { jobId: (neg as any).job_id, negotiationId: (neg as any).id } : null };
  },

  feed: async (): Promise<FeedJob[]> => {
    const { data, error } = await supabase.from('freelancer_feed').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapFeedJob);
  },

  getJobById: async (jobId: string): Promise<FeedJob> => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, users!jobs_client_id_fkey(name, avatar_url, rating, review_count, created_at, entity_type, company_name)')
      .eq('id', jobId)
      .single();
    if (error) throw error;
    const j = data as any;
    return {
      ...mapFeedJob(j),
      clientName: j.users?.name ?? 'Client',
      clientAvatar: j.users?.avatar_url,
      clientRating: j.users?.rating ?? 0,
      clientReviewCount: j.users?.review_count ?? 0,
      clientCreatedAt: j.users?.created_at,
      clientEntityType: j.users?.entity_type,
      clientCompanyName: j.users?.company_name,
      agreementText: j.agreement_text,
    } as FeedJob & { clientAvatar: string; clientRating: number; clientReviewCount: number; clientCreatedAt: string; clientEntityType: string; clientCompanyName: string; agreementText: string };
  },

  myJobs: async (): Promise<FeedJob[]> => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('jobs').select('*, users!jobs_client_id_fkey(name)').eq('client_id', session.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((j: any) => ({ ...mapFeedJob(j), clientName: j.users?.name ?? 'Unknown' }));
  },

  joinNegotiation: async (specificNegotiationId?: string): Promise<NegotiationState> => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    let negQuery = supabase
      .from('negotiations').select('id, outcome, closed_at, job_id, client_id, freelancer_id')
      .or(`client_id.eq.${session.user.id},freelancer_id.eq.${session.user.id}`)
      .is('outcome', null).order('created_at', { ascending: false });
    if (specificNegotiationId) {
      negQuery = negQuery.eq('id', specificNegotiationId);
    } else {
      negQuery = negQuery.limit(1);
    }
    const { data: neg } = await negQuery.single();
    if (!neg) throw new Error('No active negotiation');
    const n = neg as any;
    const myRole = n.client_id === session.user.id ? 'CLIENT' : 'FREELANCER';
    const { data: job } = await supabase.from('jobs').select('id, title, description, budget_cents, agreement_text, client_id, currency').eq('id', n.job_id).single();
    const j = job as any;
    const { data: clientUser } = await supabase.from('users').select('name').eq('id', j.client_id).single();
    const { data: freelancerUser } = await supabase.from('users').select('id, name, avatar_url').eq('id', n.freelancer_id).single();
    const { data: senderUsers } = await supabase.from('users').select('id, name');
    const userMap: Record<string, string> = {};
    (senderUsers ?? []).forEach((u: any) => { userMap[u.id] = u.name; });
    const { data: msgs } = await supabase.from('negotiation_messages').select('id, sender_id, body, image_url, created_at').eq('negotiation_id', n.id).order('created_at', { ascending: true });
    return {
      negotiationId: n.id, myRole, outcome: n.outcome, closedAt: n.closed_at,
      job: { id: j.id, title: j.title, description: j.description, budgetCents: j.budget_cents, agreementText: j.agreement_text, clientName: (clientUser as any)?.name ?? 'Client', clientId: j.client_id, freelancerName: (freelancerUser as any)?.name ?? 'Freelancer', freelancerId: n.freelancer_id, freelancerAvatar: (freelancerUser as any)?.avatar_url ?? undefined, currency: j.currency ?? 'USD' },
      messages: (msgs ?? []).map((m: any) => ({ id: m.id, senderId: m.sender_id, senderName: userMap[m.sender_id] ?? 'User', body: m.body, imageUrl: m.image_url ?? undefined, createdAt: m.created_at })),
    };
  },

  getClientNegotiations: async () => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data: negs } = await supabase
      .from('negotiations').select('id, outcome, closed_at, job_id, client_id, freelancer_id, created_at')
      .eq('client_id', session.user.id)
      .order('created_at', { ascending: false });
    if (!negs || negs.length === 0) return [];
    const results = [];
    for (const n of negs as any[]) {
      const { data: job } = await supabase.from('jobs').select('id, title, budget_cents, currency, status').eq('id', n.job_id).single();
      const j = job as any;
      const { data: freelancer } = await supabase.from('users').select('id, name, avatar_url').eq('id', n.freelancer_id).single();
      const f = freelancer as any;
      const { data: lastMsg } = await supabase.from('negotiation_messages').select('body, created_at, sender_id').eq('negotiation_id', n.id).order('created_at', { ascending: false }).limit(1).single();
      results.push({
        id: n.id,
        jobId: n.job_id,
        jobTitle: j?.title ?? 'Untitled',
        budgetCents: j?.budget_cents ?? 0,
        currency: j?.currency ?? 'USD',
        jobStatus: j?.status ?? 'OPEN',
        outcome: n.outcome,
        closedAt: n.closed_at,
        createdAt: n.created_at,
        freelancerId: n.freelancer_id,
        freelancerName: f?.name ?? 'Freelancer',
        freelancerAvatar: f?.avatar_url,
        lastMessage: lastMsg ? { body: (lastMsg as any).body, createdAt: (lastMsg as any).created_at, senderId: (lastMsg as any).sender_id } : null,
      });
    }
    return results;
  },

  sendMessage: async (negotiationId: string, body: string, imageUrl?: string) => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('negotiation_messages')
      .insert({ negotiation_id: negotiationId, sender_id: session.user.id, body: body || '', image_url: imageUrl || null })
      .select('id, sender_id, body, image_url, created_at')
      .single();
    if (error) throw error;
    const m = data as any;
    return { id: m.id, senderId: m.sender_id, senderName: session.user.user_metadata?.name ?? 'User', body: m.body, imageUrl: m.image_url ?? undefined, createdAt: m.created_at };
  },

  subscribeToMessages: (negotiationId: string, onMessage: (msg: ChatMessage) => void) => {
    const channel = supabase
      .channel(`neg:${negotiationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'negotiation_messages',
        filter: `negotiation_id=eq.${negotiationId}`,
      }, async (payload) => {
        const m = payload.new as any;
        const { data: user } = await supabase.from('users').select('name').eq('id', m.sender_id).single();
        onMessage({
          id: m.id,
          senderId: m.sender_id,
          senderName: (user as any)?.name ?? 'User',
          body: m.body,
          imageUrl: m.image_url ?? undefined,
          createdAt: m.created_at,
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  },

  declineNegotiation: async (negotiationId: string) => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase.rpc('decline_negotiation', {
      p_negotiation_id: negotiationId,
      p_user_id: session.user.id,
    });
    if (error) throw error;
    return data as { ok: boolean; error?: string };
  },

  acceptNegotiation: async (negotiationId: string) => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase.rpc('accept_negotiation', {
      p_negotiation_id: negotiationId,
      p_user_id: session.user.id,
    });
    if (error) throw error;
    return data as { ok: boolean; project_id?: string; error?: string };
  },

  createJob: async (d: { title: string; description: string; budgetCents: number; agreementText: string; category: string; currency?: string }) => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('jobs').insert({
      client_id: session.user.id, title: d.title, description: d.description,
      budget_cents: d.budgetCents, agreement_text: d.agreementText, category: d.category,
      currency: d.currency ?? 'USD', status: 'OPEN',
    }).select().single();
    if (error) throw error;
    return { job: mapFeedJob({ ...data, client_name: session.user.user_metadata?.name ?? 'Client' }) };
  },

  getProjects: async (): Promise<Project[]> => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('projects').select('*, milestones(*), users!projects_client_id_fkey(name)')
      .or(`client_id.eq.${session.user.id},freelancer_id.eq.${session.user.id}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((p: any) => ({
      id: p.id, jobId: p.job_id, title: p.title, description: p.description,
      budgetCents: p.budget_cents, agreementText: p.agreement_text,
      status: p.status, progress: p.progress,
      clientId: p.client_id, clientName: p.users?.name ?? 'Client',
      freelancerId: p.freelancer_id, freelancerName: 'Freelancer',
      milestones: (p.milestones ?? []).map(mapMilestone), messages: [], createdAt: p.created_at,
    }));
  },

  getProject: async (projectId: string): Promise<{ project: Project }> => {
    const { data: p, error } = await supabase
      .from('projects').select('*, milestones(*), workspace_messages(*), users!projects_client_id_fkey(name)')
      .eq('id', projectId).single();
    if (error) throw error;
    const proj = p as any;
    const senderIds = Array.from(new Set((proj.workspace_messages ?? []).map((m: any) => m.sender_id)));
    const { data: senders } = await supabase.from('users').select('id, name, role').in('id', senderIds);
    const senderMap: Record<string, { name: string; role: string }> = {};
    (senders ?? []).forEach((u: any) => { senderMap[u.id] = { name: u.name, role: u.role }; });
    return {
      project: {
        id: proj.id, jobId: proj.job_id, title: proj.title, description: proj.description,
        budgetCents: proj.budget_cents, agreementText: proj.agreement_text,
        status: proj.status, progress: proj.progress,
        clientId: proj.client_id, clientName: proj.users?.name ?? 'Client',
        freelancerId: proj.freelancer_id, freelancerName: 'Freelancer',
        milestones: (proj.milestones ?? []).map(mapMilestone),
        messages: (proj.workspace_messages ?? []).map((m: any) => ({
          id: m.id, senderId: m.sender_id, senderName: senderMap[m.sender_id]?.name ?? 'User',
          senderRole: (senderMap[m.sender_id]?.role as any) ?? 'FREELANCER', body: m.body, createdAt: m.created_at,
        })),
        createdAt: proj.created_at,
      },
    };
  },

  updateProjectProgress: async (projectId: string, progress: number): Promise<{ project: Project }> => {
    const { error } = await supabase.from('projects').update({ progress }).eq('id', projectId);
    if (error) throw error;
    return api.getProject(projectId);
  },

  updateProjectStatus: async (projectId: string, status: string): Promise<{ project: Project }> => {
    const { error } = await supabase.from('projects').update({ status }).eq('id', projectId);
    if (error) throw error;
    return api.getProject(projectId);
  },

  addMilestone: async (projectId: string, title: string): Promise<{ project: Project }> => {
    const { data: existing } = await supabase.from('milestones').select('sort_order').eq('project_id', projectId).order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const nextOrder = ((existing as any)?.sort_order ?? -1) + 1;
    const { error } = await supabase.from('milestones').insert({ project_id: projectId, title, sort_order: nextOrder });
    if (error) throw error;
    return api.getProject(projectId);
  },

  toggleMilestone: async (projectId: string, milestoneId: string): Promise<{ project: Project }> => {
    const { data: m } = await supabase.from('milestones').select('status').eq('id', milestoneId).single();
    const next = (m as any)?.status === 'DONE' ? 'TODO' : 'DONE';
    const { error } = await supabase.from('milestones').update({ status: next }).eq('id', milestoneId);
    if (error) throw error;
    return api.getProject(projectId);
  },

  sendWorkspaceMessage: async (projectId: string, body: string): Promise<{ project: Project }> => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase.from('workspace_messages').insert({ project_id: projectId, sender_id: session.user.id, body });
    if (error) throw error;
    return api.getProject(projectId);
  },

  getReviews: async (freelancerId?: string): Promise<Review[]> => {
    let q = supabase.from('reviews').select('*').order('created_at', { ascending: false });
    if (freelancerId) q = q.eq('freelancer_id', freelancerId);
    const { data, error } = await q;
    if (error) throw error;
    const userIds = Array.from(new Set((data ?? []).flatMap((r: any) => [r.client_id, r.freelancer_id])));
    const { data: users } = await supabase.from('users').select('id, name').in('id', userIds);
    const nameMap: Record<string, string> = {};
    (users ?? []).forEach((u: any) => { nameMap[u.id] = u.name; });
    return (data ?? []).map((r: any) => ({
      id: r.id, projectId: r.project_id, jobId: r.job_id,
      clientId: r.client_id, freelancerId: r.freelancer_id,
      clientName: nameMap[r.client_id] ?? 'Client', freelancerName: nameMap[r.freelancer_id] ?? 'Freelancer',
      projectTitle: 'Completed Project', rating: r.rating, comment: r.comment, createdAt: r.created_at,
    }));
  },

  submitReview: async (d: { projectId: string; rating: number; comment: string }) => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data: project } = await supabase.from('projects').select('job_id, client_id, freelancer_id').eq('id', d.projectId).single();
    if (!project) throw new Error('Project not found');
    const p = project as any;
    const { error } = await supabase.from('reviews').insert({
      project_id: d.projectId, job_id: p.job_id, client_id: p.client_id, freelancer_id: p.freelancer_id, rating: d.rating, comment: d.comment,
    });
    if (error) throw error;
    return { ok: true };
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data } = await supabase.from('user_dashboard_stats').select('*').eq('user_id', session.user.id).maybeSingle();
    const s = data as any;
    return {
      totalEarningsCents: s?.total_earnings_cents ?? 0, pendingPaymentsCents: 0,
      activeProjects: (s?.active_freelance_projects ?? 0) + (s?.ongoing_projects ?? 0),
      completedProjects: s?.completed_jobs ?? 0,
      averageRating: Number(s?.rating) || 0, reviewCount: s?.review_count ?? 0,
    };
  },

  getUserProfile: async (userId: string): Promise<{ user: User }> => {
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    const { data: jobs } = await supabase.from('jobs').select('status').eq('client_id', userId);
    const allJobs = jobs ?? [];
    const completedCount = allJobs.filter((j: any) => j.status === 'COMPLETED').length;
    const openCount = allJobs.filter((j: any) => j.status === 'OPEN').length;
    const negotiatingCount = allJobs.filter((j: any) => j.status === 'NEGOTIATING').length;
    const user = mapUser(data);
    user.completedJobs = completedCount;
    user.activeJobs = openCount + negotiatingCount;
    return { user };
  },

  getPublicClientProfile: async (clientId: string) => {
    const { data: user, error: uErr } = await supabase.from('users').select('*').eq('id', clientId).single();
    if (uErr) throw uErr;
    const { data: allJobs } = await supabase.from('jobs').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    const openJobs = (allJobs ?? []).filter((j: any) => j.status === 'OPEN').map(mapFeedJob);
    const completedJobs = (allJobs ?? []).filter((j: any) => j.status === 'COMPLETED').map(mapFeedJob);
    const { data: projects } = await supabase.from('projects').select('budget_cents').eq('client_id', clientId);
    const { data: reviews } = await supabase.from('reviews').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    const revUserIds = Array.from(new Set((reviews ?? []).flatMap((r: any) => [r.client_id, r.freelancer_id])));
    const { data: revUsers } = await supabase.from('users').select('id, name').in('id', revUserIds);
    const revNameMap: Record<string, string> = {};
    (revUsers ?? []).forEach((u: any) => { revNameMap[u.id] = u.name; });
    return {
      user: mapUser(user), openJobs, completedJobs,
      totalSpent: (projects ?? []).reduce((sum: number, p: any) => sum + (p.budget_cents || 0), 0),
      reviews: (reviews ?? []).map((r: any) => ({
        id: r.id, rating: r.rating, comment: r.comment,
        projectId: r.project_id, projectTitle: 'Completed Project',
        jobId: r.job_id, clientName: revNameMap[r.client_id] ?? 'Client',
        freelancerName: revNameMap[r.freelancer_id] ?? 'Freelancer',
        createdAt: r.created_at,
      })),
    };
  },
};
