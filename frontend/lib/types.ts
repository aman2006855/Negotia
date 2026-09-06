export type Role = 'CLIENT' | 'FREELANCER';
export type JobStatus = 'OPEN' | 'NEGOTIATING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
export type MilestoneStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type NegotiationOutcome = 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type ThemeMode = 'light' | 'dark';

export type SocialLinks = {
  instagram?: string;
  twitter?: string;
  github?: string;
  whatsapp?: string;
  linkedin?: string;
};

export interface User {
  id: string;
  name: string;
  fullName?: string;
  username?: string;
  email: string;
  role: Role;
  avatar?: string;
  coverPhotoUrl?: string;
  socialLinks?: SocialLinks;
  entityType?: 'INDIVIDUAL' | 'COMPANY';
  companyName?: string;
  industry?: string;
  companySize?: string;
  budgetRange?: string;
  workStyle?: string;
  skills: string[];
  capabilities?: string;
  about?: string;
  experience?: '0-1' | '1-3' | '3+';
  portfolioLinks: { label: string; url: string }[];
  pastWork: { title: string; description?: string; url?: string }[];
  totalEarningsCents: number;
  completedJobs: number;
  activeJobs: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
  profileCompleted?: boolean;
}

export interface FeedJob {
  id: string;
  title: string;
  description: string;
  budgetCents: number;
  category: string;
  status: JobStatus;
  lockedAt: string | null;
  createdAt: string;
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  clientRating?: number;
  clientReviewCount?: number;
  clientCreatedAt?: string;
  clientEntityType?: string;
  clientCompanyName?: string;
  agreementText?: string;
  freelancerId?: string;
  freelancerName?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
}

export interface NegotiationState {
  negotiationId: string;
  myRole: Role;
  outcome: NegotiationOutcome | null;
  closedAt: string | null;
  job: {
    id: string;
    title: string;
    description: string;
    budgetCents: number;
    agreementText: string;
    clientName: string;
    clientId: string;
  };
  messages: ChatMessage[];
}

export interface WorkspaceMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: Role;
  body: string;
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  createdAt: string;
}

export interface Project {
  id: string;
  jobId: string;
  title: string;
  description: string;
  budgetCents: number;
  agreementText: string;
  status: ProjectStatus;
  progress: number;
  clientId: string;
  clientName: string;
  freelancerId: string;
  freelancerName: string;
  milestones: Milestone[];
  messages: WorkspaceMessage[];
  createdAt: string;
}

export interface Review {
  id: string;
  projectId: string;
  projectTitle: string;
  jobId: string;
  clientName: string;
  freelancerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface DashboardStats {
  totalEarningsCents: number;
  pendingPaymentsCents: number;
  activeProjects: number;
  completedProjects: number;
  averageRating: number;
  reviewCount: number;
}

export interface Me {
  user: User;
  activeJob: { jobId: string; negotiationId: string } | null;
}
