import type {
  FeedJob, Me, NegotiationState, ChatMessage,
  User, Project, Review, DashboardStats, Milestone,
  WorkspaceMessage,
} from './types';

const MOCK_USERS: Record<string, User> = {
  c1: {
    id: 'c1', name: 'Ava Chen', email: 'client@demo.dev', role: 'CLIENT',
    skills: [], portfolioLinks: [], pastWork: [],
    totalEarningsCents: 0, completedJobs: 6, activeJobs: 2, rating: 4.9, reviewCount: 4,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  f1: {
    id: 'f1', name: 'Sam Rivera', email: 'freelancer@demo.dev', role: 'FREELANCER',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS', 'Next.js'],
    capabilities: 'Full-stack web apps, REST APIs, React dashboards, real-time systems',
    experience: '3+',
    portfolioLinks: [
      { label: 'GitHub', url: 'https://github.com/samrivera' },
      { label: 'Portfolio', url: 'https://samrivera.dev' },
    ],
    pastWork: [
      { title: 'E-commerce Platform Migration', description: 'Migrated Shopify store to custom Next.js solution' },
      { title: 'Real-time Analytics Dashboard', description: 'Built with React, D3.js, and WebSocket' },
    ],
    totalEarningsCents: 1245000, completedJobs: 8, activeJobs: 1, rating: 4.8, reviewCount: 6,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  f2: {
    id: 'f2', name: 'Jordan Kim', email: 'jordan@demo.dev', role: 'FREELANCER',
    skills: ['Figma', 'UI/UX Design', 'React', 'CSS', 'Framer Motion'],
    capabilities: 'Design systems, mobile UI, interactive prototypes, brand identity',
    experience: '1-3',
    portfolioLinks: [
      { label: 'Dribbble', url: 'https://dribbble.com/jordankim' },
      { label: 'Behance', url: 'https://behance.net/jordankim' },
    ],
    pastWork: [
      { title: 'SaaS Dashboard Redesign', description: 'Complete UI overhaul for B2B SaaS platform' },
    ],
    totalEarningsCents: 890000, completedJobs: 5, activeJobs: 0, rating: 4.6, reviewCount: 4,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
};

const MOCK_JOBS: FeedJob[] = [
  {
    id: 'j1', title: 'Design a mobile onboarding flow',
    description: 'Create 4–5 screen mobile onboarding flow with illustrations, progress indicators, and a final CTA. Figma handoff included. Must be accessible (WCAG 2.1 AA).',
    budgetCents: 180000, status: 'OPEN', lockedAt: null, createdAt: new Date(Date.now() - 3600000).toISOString(),
    clientId: 'c1', clientName: 'Ava Chen',
  },
  {
    id: 'j2', title: 'Build a REST API for a booking system',
    description: 'Node.js/Express REST API for appointment booking. Features: user auth (JWT), availability slots, booking CRUD, email notifications, rate limiting.',
    budgetCents: 320000, status: 'OPEN', lockedAt: null, createdAt: new Date(Date.now() - 7200000).toISOString(),
    clientId: 'c1', clientName: 'Ava Chen',
  },
  {
    id: 'j3', title: 'Refactor jQuery dashboard to React',
    description: 'Migrate legacy jQuery-based admin dashboard to React 18 with TypeScript. ~15 pages, data tables, charts, form builders. Pixel-perfect parity.',
    budgetCents: 540000, status: 'NEGOTIATING', lockedAt: new Date(Date.now() - 600000).toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString(),
    clientId: 'c1', clientName: 'Ava Chen', freelancerId: 'f1', freelancerName: 'Sam Rivera',
  },
  {
    id: 'j4', title: 'Write technical documentation for API',
    description: 'Comprehensive API documentation with examples, error codes, authentication guides, and SDK snippets. OpenAPI/Swagger format preferred.',
    budgetCents: 95000, status: 'OPEN', lockedAt: null, createdAt: new Date(Date.now() - 1800000).toISOString(),
    clientId: 'c1', clientName: 'Ava Chen',
  },
  {
    id: 'j5', title: 'Set up CI/CD pipeline with GitHub Actions',
    description: 'Configure automated testing, building, and deployment pipeline. Docker containerization, staging and production environments.',
    budgetCents: 150000, status: 'COMPLETED', lockedAt: null, createdAt: new Date(Date.now() - 172800000).toISOString(),
    clientId: 'c1', clientName: 'Ava Chen', freelancerId: 'f1', freelancerName: 'Sam Rivera',
  },
  {
    id: 'j6', title: 'Design brand identity for SaaS startup',
    description: 'Logo design, color palette, typography system, and brand guidelines document. Must work across web, mobile, and print.',
    budgetCents: 250000, status: 'OPEN', lockedAt: null, createdAt: new Date(Date.now() - 5400000).toISOString(),
    clientId: 'c1', clientName: 'Ava Chen',
  },
  {
    id: 'j7', title: 'Build e-commerce product configurator',
    description: 'Interactive product configurator with real-time pricing, image previews, and cart integration. React + Three.js preferred.',
    budgetCents: 420000, status: 'IN_PROGRESS', lockedAt: null, createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    clientId: 'c1', clientName: 'Ava Chen', freelancerId: 'f1', freelancerName: 'Sam Rivera',
  },
];

const MOCK_MESSAGES: ChatMessage[] = [
  { id: 'm1', senderId: 'f1', senderName: 'Sam Rivera', body: 'Hi! I saw your job post for the React migration. I have 5 years of experience with React and have done similar jQuery migrations before.', createdAt: new Date(Date.now() - 300000).toISOString() },
  { id: 'm2', senderId: 'c1', senderName: 'Ava Chen', body: 'Great! Can you tell me about your approach? We have about 15 pages with complex data tables.', createdAt: new Date(Date.now() - 240000).toISOString() },
  { id: 'm3', senderId: 'f1', senderName: 'Sam Rivera', body: 'I would start with the core layout and auth, then migrate page by page. Each table gets its own component with proper typing. I typically use TanStack Table for complex grids.', createdAt: new Date(Date.now() - 180000).toISOString() },
  { id: 'm4', senderId: 'c1', senderName: 'Ava Chen', body: 'That sounds like a solid plan. What about the charts? We use Chart.js currently.', createdAt: new Date(Date.now() - 120000).toISOString() },
];

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1', jobId: 'j7', title: 'Build e-commerce product configurator',
    description: 'Interactive product configurator with real-time pricing, image previews, and cart integration.',
    budgetCents: 420000, agreementText: 'Payment on delivery. 2 revision rounds included. NDA required before project start. Timeline: 21 calendar days from kickoff.',
    status: 'IN_PROGRESS', progress: 45,
    clientId: 'c1', clientName: 'Ava Chen', freelancerId: 'f1', freelancerName: 'Sam Rivera',
    milestones: [
      { id: 'ms1', title: 'Project setup and architecture', status: 'DONE', createdAt: new Date(Date.now() - 10 * 86400000).toISOString() },
      { id: 'ms2', title: 'Product data model and API', status: 'DONE', createdAt: new Date(Date.now() - 8 * 86400000).toISOString() },
      { id: 'ms3', title: 'Configurator UI with Three.js', status: 'IN_PROGRESS', createdAt: new Date(Date.now() - 5 * 86400000).toISOString() },
      { id: 'ms4', title: 'Real-time pricing engine', status: 'TODO', createdAt: new Date(Date.now() - 3 * 86400000).toISOString() },
      { id: 'ms5', title: 'Cart integration and checkout', status: 'TODO', createdAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    ],
    messages: [
      { id: 'wm1', senderId: 'c1', senderName: 'Ava Chen', senderRole: 'CLIENT', body: 'Can we add color customization for the product preview?', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: 'wm2', senderId: 'f1', senderName: 'Sam Rivera', senderRole: 'FREELANCER', body: 'Yes! I will add a color picker component that updates the Three.js scene in real-time. Should be ready by tomorrow.', createdAt: new Date(Date.now() - 2 * 86400000 + 3600000).toISOString() },
      { id: 'wm3', senderId: 'c1', senderName: 'Ava Chen', senderRole: 'CLIENT', body: 'Perfect. Also, the client wants to see a size comparison tool. Can we add that?', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 'wm4', senderId: 'f1', senderName: 'Sam Rivera', senderRole: 'FREELANCER', body: 'Sure, I will add a size comparison overlay after the configurator is done. It should not add much to the timeline.', createdAt: new Date(Date.now() - 86400000 + 1800000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
];

const MOCK_REVIEWS: Review[] = [
  { id: 'r1', projectId: 'p0', projectTitle: 'CI/CD Pipeline Setup', jobId: 'j5', clientName: 'Ava Chen', freelancerName: 'Sam Rivera', rating: 5, comment: 'Excellent work on the CI/CD pipeline. Sam set up everything perfectly with automated testing and deployment. Highly recommend!', createdAt: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: 'r2', projectId: 'p-1', projectTitle: 'Real-time Analytics Dashboard', jobId: 'j-prev', clientName: 'Marcus Lee', freelancerName: 'Sam Rivera', rating: 5, comment: 'Built a complete real-time analytics dashboard. Delivered on time with great communication throughout.', createdAt: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: 'r3', projectId: 'p-2', projectTitle: 'React Component Library', jobId: 'j-prev2', clientName: 'Elena Vasquez', freelancerName: 'Sam Rivera', rating: 4, comment: 'Great React work. Minor delays on the final deliverable but overall quality was excellent.', createdAt: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: 'r4', projectId: 'p-3', projectTitle: 'E-commerce Platform Migration', jobId: 'j-prev3', clientName: 'Tom Wilson', freelancerName: 'Sam Rivera', rating: 5, comment: 'Sam migrated our entire e-commerce platform from Shopify to Next.js. Zero downtime during the switch.', createdAt: new Date(Date.now() - 75 * 86400000).toISOString() },
  { id: 'r5', projectId: 'p-4', projectTitle: 'SaaS Design System', jobId: 'j-prev4', clientName: 'Ava Chen', freelancerName: 'Jordan Kim', rating: 5, comment: 'Beautiful design system for our SaaS product. Jordan understood our vision perfectly.', createdAt: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: 'r6', projectId: 'p-5', projectTitle: 'Mobile App UI', jobId: 'j-prev5', clientName: 'Priya Sharma', freelancerName: 'Jordan Kim', rating: 4, comment: 'Great mobile UI design. The prototypes were very polished.', createdAt: new Date(Date.now() - 40 * 86400000).toISOString() },
];

let currentUser: User | null = null;
let activeJob: { jobId: string; negotiationId: string } | null = null;

export const SKILL_OPTIONS = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte',
  'TypeScript', 'JavaScript', 'Python', 'Node.js', 'Go', 'Rust',
  'PostgreSQL', 'MongoDB', 'Redis', 'Firebase', 'Supabase',
  'Tailwind CSS', 'CSS', 'SASS', 'Styled Components',
  'Figma', 'UI/UX Design', 'Framer Motion', 'Three.js',
  'Docker', 'AWS', 'GCP', 'Vercel', 'GitHub Actions',
  'GraphQL', 'REST API', 'WebSocket', 'gRPC',
  'React Native', 'Flutter', 'Swift', 'Kotlin',
  'Machine Learning', 'TensorFlow', 'OpenAI',
];

export const EXPERIENCE_OPTIONS = [
  { value: '0-1', label: '0–1 years' },
  { value: '1-3', label: '1–3 years' },
  { value: '3+', label: '3+ years' },
];

export const mockApi = {
  isLoggedIn: () => currentUser !== null,

  login: async (email: string, _password: string) => {
    await new Promise((r) => setTimeout(r, 300));
    if (email === 'client@demo.dev') currentUser = MOCK_USERS.c1;
    else if (email === 'freelancer@demo.dev') currentUser = MOCK_USERS.f1;
    else if (email === 'jordan@demo.dev') currentUser = MOCK_USERS.f2;
    else throw new Error('Invalid email or password');
    return { user: currentUser, activeJob };
  },

  googleLogin: async () => {
    await new Promise((r) => setTimeout(r, 500));
    const id = 'g' + Date.now();
    const user: User = {
      id, name: 'Alex Google', email: 'alex@gmail.com', role: 'FREELANCER',
      skills: [], portfolioLinks: [], pastWork: [],
      totalEarningsCents: 0, completedJobs: 0, activeJobs: 0, rating: 0, reviewCount: 0,
      createdAt: new Date().toISOString(),
    };
    currentUser = user;
    return { user, activeJob: null };
  },

  signup: async (data: { name: string; email: string; password: string }) => {
    await new Promise((r) => setTimeout(r, 400));
    const id = 'u' + Date.now();
    const user: User = {
      id, name: data.name, email: data.email, role: 'FREELANCER',
      skills: [], portfolioLinks: [], pastWork: [],
      totalEarningsCents: 0, completedJobs: 0, activeJobs: 0, rating: 0, reviewCount: 0,
      createdAt: new Date().toISOString(),
    };
    currentUser = user;
    return { user, activeJob: null };
  },

  updateProfile: async (data: Partial<User>): Promise<Me> => {
    await new Promise((r) => setTimeout(r, 300));
    if (currentUser) Object.assign(currentUser, data);
    return { user: currentUser!, activeJob };
  },

  me: async (): Promise<Me> => {
    await new Promise((r) => setTimeout(r, 100));
    if (!currentUser) throw new Error('Not authenticated');
    return { user: currentUser, activeJob };
  },

  feed: async () => {
    await new Promise((r) => setTimeout(r, 200));
    return { jobs: MOCK_JOBS.filter((j) => j.status === 'OPEN') };
  },

  myJobs: async () => {
    await new Promise((r) => setTimeout(r, 200));
    return { jobs: MOCK_JOBS };
  },

  createJob: async (data: { title: string; description: string; budgetCents: number; agreementText: string }) => {
    await new Promise((r) => setTimeout(r, 400));
    const job: FeedJob = {
      id: 'j' + Date.now(), ...data, status: 'OPEN', lockedAt: null,
      createdAt: new Date().toISOString(), clientId: currentUser?.id ?? 'c1', clientName: currentUser?.name ?? 'Ava Chen',
    };
    MOCK_JOBS.unshift(job);
    return { job };
  },

  joinNegotiation: async (): Promise<NegotiationState> => {
    await new Promise((r) => setTimeout(r, 200));
    return {
      negotiationId: 'n1',
      myRole: currentUser?.role ?? 'FREELANCER',
      outcome: null, closedAt: null,
      job: {
        id: 'j3', title: 'Refactor jQuery dashboard to React',
        description: 'Migrate legacy jQuery-based admin dashboard to React 18 with TypeScript.',
        budgetCents: 540000,
        agreementText: 'Payment on delivery. 2 revision rounds included. NDA required before project start. Timeline: 14 calendar days from kickoff. All source files transferred upon final payment. Late delivery penalty: 5% per day after deadline. Code reviews required at each phase boundary. 10% holdback until UAT sign-off.',
        clientName: 'Ava Chen',
        clientId: 'c1',
      },
      messages: MOCK_MESSAGES,
    };
  },

  lockJob: async (jobId: string) => {
    await new Promise((r) => setTimeout(r, 300));
    const job = MOCK_JOBS.find((j) => j.id === jobId);
    if (!job || job.status !== 'OPEN') return { ok: false, error: 'JOB_TAKEN' };
    job.status = 'NEGOTIATING';
    job.lockedAt = new Date().toISOString();
    job.freelancerId = currentUser?.id ?? 'f1';
    job.freelancerName = currentUser?.name ?? 'Sam Rivera';
    activeJob = { jobId, negotiationId: 'n1' };
    return { ok: true, negotiation: { id: 'n1', jobId, clientId: 'c1', freelancerId: 'f1', createdAt: new Date().toISOString() }, job };
  },

  decline: async () => {
    await new Promise((r) => setTimeout(r, 200));
    const job = MOCK_JOBS.find((j) => j.id === 'j3');
    if (job) { job.status = 'OPEN'; job.lockedAt = null; job.freelancerId = undefined; job.freelancerName = undefined; }
    activeJob = null;
    return { ok: true };
  },

  sign: async () => {
    await new Promise((r) => setTimeout(r, 300));
    const job = MOCK_JOBS.find((j) => j.id === 'j3');
    if (job) {
      job.status = 'IN_PROGRESS';
      job.lockedAt = null;
      const project: Project = {
        id: 'p' + Date.now(), jobId: job.id, title: job.title, description: job.description,
        budgetCents: job.budgetCents, agreementText: 'Payment on delivery. 2 revision rounds included. NDA required.',
        status: 'NOT_STARTED', progress: 0,
        clientId: job.clientId, clientName: job.clientName,
        freelancerId: job.freelancerId ?? 'f1', freelancerName: job.freelancerName ?? 'Sam Rivera',
        milestones: [], messages: [], createdAt: new Date().toISOString(),
      };
      MOCK_PROJECTS.push(project);
    }
    activeJob = null;
    return { ok: true };
  },

  sendMessage: async (body: string) => {
    await new Promise((r) => setTimeout(r, 100));
    const msg: ChatMessage = {
      id: 'm' + Date.now(), senderId: currentUser?.id ?? 'f1', senderName: currentUser?.name ?? 'Sam Rivera',
      body, createdAt: new Date().toISOString(),
    };
    MOCK_MESSAGES.push(msg);
    return msg;
  },

  releaseLock: () => { activeJob = null; },

  getProjects: async () => {
    await new Promise((r) => setTimeout(r, 200));
    return { projects: MOCK_PROJECTS };
  },

  getProject: async (projectId: string) => {
    await new Promise((r) => setTimeout(r, 150));
    const project = MOCK_PROJECTS.find((p) => p.id === projectId);
    if (!project) throw new Error('Project not found');
    return { project };
  },

  updateProjectProgress: async (projectId: string, progress: number) => {
    await new Promise((r) => setTimeout(r, 200));
    const project = MOCK_PROJECTS.find((p) => p.id === projectId);
    if (project) project.progress = progress;
    return { ok: true };
  },

  updateProjectStatus: async (projectId: string, status: Project['status']) => {
    await new Promise((r) => setTimeout(r, 200));
    const project = MOCK_PROJECTS.find((p) => p.id === projectId);
    if (project) project.status = status;
    return { ok: true };
  },

  addMilestone: async (projectId: string, title: string) => {
    await new Promise((r) => setTimeout(r, 200));
    const project = MOCK_PROJECTS.find((p) => p.id === projectId);
    const milestone: Milestone = { id: 'ms' + Date.now(), title, status: 'TODO', createdAt: new Date().toISOString() };
    if (project) project.milestones.push(milestone);
    return { milestone };
  },

  toggleMilestone: async (projectId: string, milestoneId: string) => {
    await new Promise((r) => setTimeout(r, 150));
    const project = MOCK_PROJECTS.find((p) => p.id === projectId);
    const ms = project?.milestones.find((m) => m.id === milestoneId);
    if (ms) {
      const states: Milestone['status'][] = ['TODO', 'IN_PROGRESS', 'DONE'];
      const i = states.indexOf(ms.status);
      ms.status = states[(i + 1) % states.length];
    }
    return { ok: true };
  },

  sendWorkspaceMessage: async (projectId: string, body: string) => {
    await new Promise((r) => setTimeout(r, 100));
    const project = MOCK_PROJECTS.find((p) => p.id === projectId);
    const msg: WorkspaceMessage = {
      id: 'wm' + Date.now(), senderId: currentUser?.id ?? 'f1', senderName: currentUser?.name ?? 'Sam Rivera',
      senderRole: currentUser?.role ?? 'FREELANCER', body, createdAt: new Date().toISOString(),
    };
    if (project) project.messages.push(msg);
    return { message: msg };
  },

  getReviews: async (freelancerId?: string) => {
    await new Promise((r) => setTimeout(r, 150));
    const reviews = freelancerId ? MOCK_REVIEWS.filter((r) => {
      const user = Object.values(MOCK_USERS).find((u) => u.id === freelancerId);
      return user && r.freelancerName === user.name;
    }) : MOCK_REVIEWS;
    return { reviews };
  },

  submitReview: async (data: { projectId: string; rating: number; comment: string }) => {
    await new Promise((r) => setTimeout(r, 300));
    const project = MOCK_PROJECTS.find((p) => p.id === data.projectId);
    const review: Review = {
      id: 'r' + Date.now(), projectId: data.projectId, projectTitle: project?.title ?? 'Project',
      jobId: project?.jobId ?? '',
      clientName: currentUser?.name ?? 'Ava Chen', freelancerName: project?.freelancerName ?? '',
      rating: data.rating, comment: data.comment, createdAt: new Date().toISOString(),
    };
    MOCK_REVIEWS.unshift(review);
    return { review };
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    await new Promise((r) => setTimeout(r, 200));
    return {
      totalEarningsCents: currentUser?.totalEarningsCents ?? 0,
      pendingPaymentsCents: 420000,
      activeProjects: currentUser?.activeJobs ?? 0,
      completedProjects: currentUser?.completedJobs ?? 0,
      averageRating: currentUser?.rating ?? 0,
      reviewCount: currentUser?.reviewCount ?? 0,
    };
  },

  getUserProfile: async (userId: string) => {
    await new Promise((r) => setTimeout(r, 150));
    const user = MOCK_USERS[userId];
    if (!user) throw new Error('User not found');
    return { user };
  },

  getClientJobs: async (clientId: string) => {
    await new Promise((r) => setTimeout(r, 150));
    const jobs = MOCK_JOBS.filter((j) => j.clientId === clientId && (j.status === 'OPEN' || j.status === 'NEGOTIATING'));
    return { jobs };
  },

  getClientCompletedProjects: async (clientId: string) => {
    await new Promise((r) => setTimeout(r, 150));
    const projects = MOCK_PROJECTS.filter((p) => p.clientId === clientId && (p.status === 'COMPLETED' || p.progress === 100));
    const completedFromJobs = MOCK_JOBS.filter((j) => j.clientId === clientId && j.status === 'COMPLETED').map((j) => ({
      id: 'cp-' + j.id, title: j.title, description: j.description, budgetCents: j.budgetCents,
      freelancerName: j.freelancerName ?? 'Unknown', completedAt: j.createdAt,
    }));
    return { projects, completedFromJobs };
  },

  getClientReviews: async (clientId: string) => {
    await new Promise((r) => setTimeout(r, 150));
    const client = MOCK_USERS[clientId];
    const reviews = MOCK_REVIEWS.filter((r) => client && r.clientName === client.name);
    return { reviews };
  },

  getPublicClientProfile: async (clientId: string) => {
    await new Promise((r) => setTimeout(r, 200));
    const user = MOCK_USERS[clientId];
    if (!user) throw new Error('Client not found');
    const openJobs = MOCK_JOBS.filter((j) => j.clientId === clientId && (j.status === 'OPEN' || j.status === 'NEGOTIATING'));
    const completedJobs = MOCK_JOBS.filter((j) => j.clientId === clientId && j.status === 'COMPLETED');
    const reviews = MOCK_REVIEWS.filter((r) => r.clientName === user.name);
    const totalSpentCents = MOCK_JOBS.filter((j) => j.clientId === clientId && j.status === 'COMPLETED').reduce((sum, j) => sum + j.budgetCents, 0);
    return {
      user: { ...user, totalEarningsCents: totalSpentCents },
      openJobs,
      completedJobs,
      reviews,
    };
  },
};
