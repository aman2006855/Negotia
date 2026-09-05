import { create } from 'zustand';
import type { FeedJob, Me, User, Project, Review, DashboardStats } from './types';

interface AppState {
  user: User | null;
  jobs: FeedJob[];
  jobsLoaded: boolean;
  myActiveJobId: string | null;
  myNegotiationId: string | null;
  projects: Project[];
  reviews: Review[];
  dashboardStats: DashboardStats | null;
  toast: string | null;
  sidebarOpen: boolean;

  setUser: (user: User) => void;
  setJobs: (jobs: FeedJob[]) => void;
  upsertJob: (job: FeedJob) => void;
  patchJob: (id: string, patch: Partial<FeedJob>) => void;
  acquireLock: (jobId: string, negotiationId: string) => void;
  releaseLock: () => void;
  setProjects: (projects: Project[]) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  setReviews: (reviews: Review[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
  toggleSidebar: () => void;
  logout: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

export const useBoard = create<AppState>((set) => ({
  user: null,
  jobs: [],
  jobsLoaded: false,
  myActiveJobId: null,
  myNegotiationId: null,
  projects: [],
  reviews: [],
  dashboardStats: null,
  toast: null,
  sidebarOpen: false,

  setUser: (user) => set({ user }),
  setJobs: (jobs) => set({ jobs, jobsLoaded: true }),
  upsertJob: (job) => set((s) => {
    const i = s.jobs.findIndex((j) => j.id === job.id);
    if (i === -1) return { jobs: [job, ...s.jobs] };
    const next = [...s.jobs];
    next[i] = { ...next[i]!, ...job };
    return { jobs: next };
  }),
  patchJob: (id, patch) => set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, ...patch } : j)) })),
  acquireLock: (jobId, negotiationId) => set({ myActiveJobId: jobId, myNegotiationId: negotiationId }),
  releaseLock: () => set({ myActiveJobId: null, myNegotiationId: null }),
  setProjects: (projects) => set({ projects }),
  updateProject: (id, patch) => set((s) => ({
    projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  })),
  setReviews: (reviews) => set({ reviews }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  showToast: (message) => {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 4000);
  },
  dismissToast: () => set({ toast: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  logout: () => set({
    user: null, jobs: [], jobsLoaded: false, myActiveJobId: null, myNegotiationId: null,
    projects: [], reviews: [], dashboardStats: null,
  }),
}));
