import type { FeedJob, Me, NegotiationState, User, Project, Review, DashboardStats, ChatMessage, WorkspaceMessage } from './types';
import { mockApi } from './mock';
import { supabase, signInWithEmail, signUpWithEmail, signInWithGoogle as sbGoogle, getSession } from './supabase';

const USE_MOCK = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_USE_MOCK === '1';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('negotia_token');
}
export function setToken(token: string) { window.localStorage.setItem('negotia_token', token); }
export function clearToken() { window.localStorage.removeItem('negotia_token'); }

function mapUser(u: any): User {
  return {
    id: u.id, name: u.name, email: u.email, role: u.role,
    avatar: u.avatar_url, skills: u.skills ?? [],
    capabilities: u.capabilities, experience: u.experience,
    portfolioLinks: u.portfolio_links ?? [], pastWork: u.past_work ?? [],
    totalEarningsCents: u.total_earnings_cents ?? 0,
    completedJobs: u.completed_jobs ?? 0, activeJobs: u.active_jobs ?? 0,
    rating: Number(u.rating) || 0, reviewCount: u.review_count ?? 0,
    createdAt: u.created_at,
  };
}

function mapFeedJob(j: any): FeedJob {
  return {
    id: j.id, title: j.title, description: j.description,
    budgetCents: j.budget_cents, status: j.status,
    lockedAt: j.locked_at ?? null, createdAt: j.created_at,
    clientId: j.client_id, clientName: j.client_name ?? j.clientName ?? 'Client',
    freelancerId: j.freelancer_id, freelancerName: j.freelancer_name ?? j.freelancerName,
  };
}

function mapMilestone(m: any) {
  return { id: m.id, title: m.title, status: m.status, sortOrder: m.sort_order ?? 0, createdAt: m.created_at ?? new Date().toISOString() };
}

export const api = {
  login: async (email: string, password: string): Promise<Me> => {
    if (USE_MOCK) return mockApi.login(email, password);
    const result = await signInWithEmail(email, password);
    setToken(result.session.access_token);
    return api.me();
  },

  googleLogin: async () => {
    if (USE_MOCK) return mockApi.googleLogin();
    return sbGoogle();
  },

  signup: async (d: { name: string; email: string; password: string }): Promise<Me> => {
    if (USE_MOCK) return mockApi.signup(d);
    const result = await signUpWithEmail(d.email, d.password, d.name);
    if (result.session) setToken(result.session.access_token);
    try { return await api.me(); } catch {
      return { user: mapUser({ id: result.user?.id ?? '', name: d.name, email: d.email, role: 'FREELANCER', skills: [], portfolio_links: [], past_work: [], total_earnings_cents: 0, completed_jobs: 0, active_jobs: 0, rating: 0, review_count: 0, created_at: new Date().toISOString() }), activeJob: null };
    }
  },

  updateProfile: async (data: Partial<User>): Promise<Me> => {
    if (USE_MOCK) return mockApi.updateProfile(data);
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase.from('users').update({
      name: data.name, role: data.role, skills: data.skills,
      capabilities: data.capabilities, experience: data.experience,
      portfolio_links: data.portfolioLinks, past_work: data.pastWork,
    }).eq('id', session.user.id);
    if (error) throw error;
    return api.me();
  },

  me: async (): Promise<Me> => {
    if (USE_MOCK) return mockApi.me();
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).single();
    if (error) throw error;
    const user = mapUser(data);
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
    if (USE_MOCK) {
      const r = await mockApi.feed();
      return Array.isArray(r) ? r : (r as any).jobs ?? [];
    }
    const { data, error } = await supabase.from('freelancer_feed').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(mapFeedJob);
  },

  myJobs: async (): Promise<FeedJob[]> => {
    if (USE_MOCK) {
      const r = await mockApi.myJobs();
      return Array.isArray(r) ? r : (r as any).jobs ?? [];
    }
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('jobs').select('*, users!jobs_client_id_fkey(name)').eq('client_id', session.user.id).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((j: any) => ({ ...mapFeedJob(j), clientName: j.users?.name ?? 'Unknown' }));
  },

  joinNegotiation: async (): Promise<NegotiationState> => {
    if (USE_MOCK) return mockApi.joinNegotiation();
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data: neg } = await supabase
      .from('negotiations').select('id, outcome, closed_at, job_id, client_id, freelancer_id')
      .or(`client_id.eq.${session.user.id},freelancer_id.eq.${session.user.id}`)
      .is('outcome', null).order('created_at', { ascending: false }).limit(1).single();
    if (!neg) throw new Error('No active negotiation');
    const n = neg as any;
    const myRole = n.client_id === session.user.id ? 'CLIENT' : 'FREELANCER';
    const { data: job } = await supabase.from('jobs').select('id, title, description, budget_cents, agreement_text, client_id').eq('id', n.job_id).single();
    const j = job as any;
    const { data: clientUser } = await supabase.from('users').select('name').eq('id', j.client_id).single();
    const { data: senderUsers } = await supabase.from('users').select('id, name');
    const userMap: Record<string, string> = {};
    (senderUsers ?? []).forEach((u: any) => { userMap[u.id] = u.name; });
    const { data: msgs } = await supabase.from('negotiation_messages').select('id, sender_id, body, created_at').eq('negotiation_id', n.id).order('created_at', { ascending: true });
    return {
      negotiationId: n.id, myRole, outcome: n.outcome, closedAt: n.closed_at,
      job: { id: j.id, title: j.title, description: j.description, budgetCents: j.budget_cents, agreementText: j.agreement_text, clientName: (clientUser as any)?.name ?? 'Client', clientId: j.client_id },
      messages: (msgs ?? []).map((m: any) => ({ id: m.id, senderId: m.sender_id, senderName: userMap[m.sender_id] ?? 'User', body: m.body, createdAt: m.created_at })),
    };
  },

  createJob: async (d: { title: string; description: string; budgetCents: number; agreementText: string }) => {
    if (USE_MOCK) return mockApi.createJob(d);
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { data, error } = await supabase.from('jobs').insert({
      client_id: session.user.id, title: d.title, description: d.description,
      budget_cents: d.budgetCents, agreement_text: d.agreementText, status: 'OPEN',
    }).select().single();
    if (error) throw error;
    return { job: mapFeedJob({ ...data, client_name: session.user.user_metadata?.name ?? 'Client' }) };
  },

  getProjects: async (): Promise<Project[]> => {
    if (USE_MOCK) {
      const r = await mockApi.getProjects();
      return Array.isArray(r) ? r : (r as any).projects ?? [];
    }
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
    if (USE_MOCK) return mockApi.getProject(projectId);
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
    if (USE_MOCK) { await mockApi.updateProjectProgress(projectId, progress); return mockApi.getProject(projectId); }
    const { error } = await supabase.from('projects').update({ progress }).eq('id', projectId);
    if (error) throw error;
    return api.getProject(projectId);
  },

  updateProjectStatus: async (projectId: string, status: string): Promise<{ project: Project }> => {
    if (USE_MOCK) { await mockApi.updateProjectStatus(projectId, status as Project['status']); return mockApi.getProject(projectId); }
    const { error } = await supabase.from('projects').update({ status }).eq('id', projectId);
    if (error) throw error;
    return api.getProject(projectId);
  },

  addMilestone: async (projectId: string, title: string): Promise<{ project: Project }> => {
    if (USE_MOCK) { await mockApi.addMilestone(projectId, title); return mockApi.getProject(projectId); }
    const { data: existing } = await supabase.from('milestones').select('sort_order').eq('project_id', projectId).order('sort_order', { ascending: false }).limit(1).maybeSingle();
    const nextOrder = ((existing as any)?.sort_order ?? -1) + 1;
    const { error } = await supabase.from('milestones').insert({ project_id: projectId, title, sort_order: nextOrder });
    if (error) throw error;
    return api.getProject(projectId);
  },

  toggleMilestone: async (projectId: string, milestoneId: string): Promise<{ project: Project }> => {
    if (USE_MOCK) { await mockApi.toggleMilestone(projectId, milestoneId); return mockApi.getProject(projectId); }
    const { data: m } = await supabase.from('milestones').select('status').eq('id', milestoneId).single();
    const next = (m as any)?.status === 'DONE' ? 'TODO' : 'DONE';
    const { error } = await supabase.from('milestones').update({ status: next }).eq('id', milestoneId);
    if (error) throw error;
    return api.getProject(projectId);
  },

  sendWorkspaceMessage: async (projectId: string, body: string): Promise<{ project: Project }> => {
    if (USE_MOCK) { await mockApi.sendWorkspaceMessage(projectId, body); return mockApi.getProject(projectId); }
    const session = await getSession();
    if (!session) throw new Error('Not authenticated');
    const { error } = await supabase.from('workspace_messages').insert({ project_id: projectId, sender_id: session.user.id, body });
    if (error) throw error;
    return api.getProject(projectId);
  },

  getReviews: async (freelancerId?: string): Promise<Review[]> => {
    if (USE_MOCK) {
      const r = await mockApi.getReviews(freelancerId);
      return Array.isArray(r) ? r : (r as any).reviews ?? [];
    }
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
    if (USE_MOCK) return mockApi.submitReview(d);
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
    if (USE_MOCK) return mockApi.getDashboardStats();
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
    if (USE_MOCK) return mockApi.getUserProfile(userId);
    const { data, error } = await supabase.from('users').select('*').eq('id', userId).single();
    if (error) throw error;
    return { user: mapUser(data) };
  },

  getPublicClientProfile: async (clientId: string) => {
    if (USE_MOCK) return mockApi.getPublicClientProfile(clientId);
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
