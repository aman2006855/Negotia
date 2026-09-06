import { create } from 'zustand';
import type { FeedJob, Me, User, Project, Review, DashboardStats, NegotiationState, ThemeMode, MarketListing, LaunchRating, SellerStats } from './types';

interface AppState {
  user: User | null;
  jobs: FeedJob[];
  jobsLoaded: boolean;
  myActiveJobId: string | null;
  myNegotiationId: string | null;
  negotiation: NegotiationState | null;
  projects: Project[];
  reviews: Review[];
  dashboardStats: DashboardStats | null;
  listings: MarketListing[];
  launches: MarketListing[];
  leaderboard: MarketListing[];
  sellerStats: SellerStats | null;
  toast: string | null;
  sidebarOpen: boolean;
  theme: ThemeMode;
  watchedJobIds: string[];

  setUser: (user: User) => void;
  setJobs: (jobs: FeedJob[]) => void;
  upsertJob: (job: FeedJob) => void;
  patchJob: (id: string, patch: Partial<FeedJob>) => void;
  acquireLock: (jobId: string, negotiationId: string) => void;
  releaseLock: () => void;
  setNegotiation: (negotiation: NegotiationState | null) => void;
  setProjects: (projects: Project[]) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  setReviews: (reviews: Review[]) => void;
  setDashboardStats: (stats: DashboardStats) => void;
  setListings: (listings: MarketListing[]) => void;
  setLaunches: (launches: MarketListing[]) => void;
  setLeaderboard: (leaderboard: MarketListing[]) => void;
  setSellerStats: (stats: SellerStats) => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
  toggleSidebar: () => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleWatch: (jobId: string) => void;
  logout: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | undefined;

function loadTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  return (localStorage.getItem('negotia_theme') as ThemeMode) || 'light';
}

function loadWatched(): string[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('negotia_watched') || '[]'); } catch { return []; }
}

export const useBoard = create<AppState>((set, get) => ({
  user: null,
  jobs: [],
  jobsLoaded: false,
  myActiveJobId: null,
  myNegotiationId: null,
  negotiation: null,
  projects: [],
  reviews: [],
  dashboardStats: null,
  listings: [],
  launches: [],
  leaderboard: [],
  sellerStats: null,
  toast: null,
  sidebarOpen: false,
  theme: loadTheme(),
  watchedJobIds: loadWatched(),

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
  setNegotiation: (negotiation) => set({ negotiation }),
  setProjects: (projects) => set({ projects }),
  updateProject: (id, patch) => set((s) => ({
    projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  })),
  setReviews: (reviews) => set({ reviews }),
  setDashboardStats: (stats) => set({ dashboardStats: stats }),
  setListings: (listings) => set({ listings }),
  setLaunches: (launches) => set({ launches }),
  setLeaderboard: (leaderboard) => set({ leaderboard }),
  setSellerStats: (stats) => set({ sellerStats: stats }),
  showToast: (message) => {
    clearTimeout(toastTimer);
    set({ toast: message });
    toastTimer = setTimeout(() => set({ toast: null }), 4000);
  },
  dismissToast: () => set({ toast: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('negotia_theme', theme);
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
    set({ theme });
  },

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(next);
  },

  toggleWatch: (jobId) => {
    const current = get().watchedJobIds;
    const next = current.includes(jobId) ? current.filter((id) => id !== jobId) : [...current, jobId];
    if (typeof window !== 'undefined') {
      localStorage.setItem('negotia_watched', JSON.stringify(next));
    }
    set({ watchedJobIds: next });
  },

  logout: () => {
    set({
      user: null, jobs: [], jobsLoaded: false, myActiveJobId: null, myNegotiationId: null,
      negotiation: null, projects: [], reviews: [], dashboardStats: null,
      listings: [], launches: [], leaderboard: [], sellerStats: null,
    });
  },
}));
