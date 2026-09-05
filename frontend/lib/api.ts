import type { FeedJob, Me, NegotiationState, User, Project, Review, DashboardStats } from './types';
import { mockApi } from './mock';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const USE_MOCK = true;

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('negotia_token');
}
export function setToken(token: string) { window.localStorage.setItem('negotia_token', token); }
export function clearToken() { window.localStorage.removeItem('negotia_token'); }

export const api = {
  login: async (email: string, password: string) => {
    if (USE_MOCK) return mockApi.login(email, password);
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  googleLogin: async () => {
    if (USE_MOCK) return mockApi.googleLogin();
    // Real implementation uses Supabase OAuth
    const { signInWithGoogle } = await import('./supabase');
    return signInWithGoogle();
  },

  signup: async (data: { name: string; email: string; password: string }) => {
    if (USE_MOCK) return mockApi.signup(data);
    const res = await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Signup failed');
    return res.json();
  },

  updateProfile: async (data: Partial<User>) => {
    if (USE_MOCK) return mockApi.updateProfile(data);
    const res = await fetch(`${API_URL}/api/auth/profile`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Profile update failed');
    return res.json();
  },

  me: async (): Promise<Me> => {
    if (USE_MOCK) return mockApi.me();
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  feed: async () => {
    if (USE_MOCK) return mockApi.feed();
    const res = await fetch(`${API_URL}/api/jobs`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json();
  },

  myJobs: async () => {
    if (USE_MOCK) return mockApi.myJobs();
    const res = await fetch(`${API_URL}/api/jobs/mine`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json();
  },

  joinNegotiation: async () => {
    if (USE_MOCK) return mockApi.joinNegotiation();
    const res = await fetch(`${API_URL}/api/negotiations/join`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Could not join negotiation');
    return res.json();
  },

  createJob: async (data: { title: string; description: string; budgetCents: number; agreementText: string }) => {
    if (USE_MOCK) return mockApi.createJob(data);
    const res = await fetch(`${API_URL}/api/jobs`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  },

  getProjects: async () => {
    if (USE_MOCK) return mockApi.getProjects();
    const res = await fetch(`${API_URL}/api/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json();
  },

  getProject: async (projectId: string): Promise<{ project: Project }> => {
    if (USE_MOCK) return mockApi.getProject(projectId);
    const res = await fetch(`${API_URL}/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json();
  },

  updateProjectProgress: async (projectId: string, progress: number) => {
    if (USE_MOCK) return mockApi.updateProjectProgress(projectId, progress);
    const res = await fetch(`${API_URL}/api/projects/${projectId}/progress`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ progress }),
    });
    return res.json();
  },

  updateProjectStatus: async (projectId: string, status: string) => {
    if (USE_MOCK) return mockApi.updateProjectStatus(projectId, status as Project['status']);
    const res = await fetch(`${API_URL}/api/projects/${projectId}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  addMilestone: async (projectId: string, title: string) => {
    if (USE_MOCK) return mockApi.addMilestone(projectId, title);
    const res = await fetch(`${API_URL}/api/projects/${projectId}/milestones`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ title }),
    });
    return res.json();
  },

  toggleMilestone: async (projectId: string, milestoneId: string) => {
    if (USE_MOCK) return mockApi.toggleMilestone(projectId, milestoneId);
    const res = await fetch(`${API_URL}/api/projects/${projectId}/milestones/${milestoneId}/toggle`, {
      method: 'POST', headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json();
  },

  sendWorkspaceMessage: async (projectId: string, body: string) => {
    if (USE_MOCK) return mockApi.sendWorkspaceMessage(projectId, body);
    const res = await fetch(`${API_URL}/api/projects/${projectId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ body }),
    });
    return res.json();
  },

  getReviews: async (freelancerId?: string) => {
    if (USE_MOCK) return mockApi.getReviews(freelancerId);
    const url = freelancerId ? `${API_URL}/api/reviews?freelancerId=${freelancerId}` : `${API_URL}/api/reviews`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } });
    return res.json();
  },

  submitReview: async (data: { projectId: string; rating: number; comment: string }) => {
    if (USE_MOCK) return mockApi.submitReview(data);
    const res = await fetch(`${API_URL}/api/reviews`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return res.json();
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    if (USE_MOCK) return mockApi.getDashboardStats();
    const res = await fetch(`${API_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json();
  },

  getUserProfile: async (userId: string): Promise<{ user: User }> => {
    if (USE_MOCK) return mockApi.getUserProfile(userId);
    const res = await fetch(`${API_URL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    return res.json();
  },

  getPublicClientProfile: async (clientId: string) => {
    if (USE_MOCK) return mockApi.getPublicClientProfile(clientId);
    const res = await fetch(`${API_URL}/api/clients/${clientId}/public`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if (!res.ok) throw new Error('Client not found');
    return res.json();
  },
};
