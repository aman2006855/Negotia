export const JOB_CATEGORIES = [
  'Web & App Development (Full-Stack)',
  'API & Backend Development',
  'Landing Page & Marketing Site',
  'Mobile App Development (iOS/Android)',
  'Progressive Web App (PWA)',
  'Frontend UI/UX Implementation',
  'Video Editing & Multimedia',
  'Content Writing & Documentation',
  'Data Entry & Processing',
  'Bug Fixing & Code Refactoring',
  'Scripting & Automation Tools',
  'Database Design & Migration',
  'E-Commerce & POS Solutions',
  'DevOps, Cloud & Deployment',
  'Digital Marketing & SEO',
] as const;

export type JobCategory = (typeof JOB_CATEGORIES)[number];

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
