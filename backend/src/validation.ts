import { z } from 'zod';
import { config } from './config';

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6).max(100),
});

export const createJobSchema = z.object({
  title: z.string().trim().min(4).max(120),
  description: z.string().trim().min(10).max(4000),
  budgetCents: z.number().int().min(100).max(50_000_000),
  agreementText: z.string().trim().min(20).max(12_000),
});

export const lockJobSchema = z.object({ jobId: z.string().min(1) });
export const joinNegotiationSchema = z.object({ negotiationId: z.string().min(1) });
export const messageSchema = z.object({
  negotiationId: z.string().min(1),
  body: z.string().trim().min(1).max(config.maxMessageLength),
});
export const refSchema = z.object({ negotiationId: z.string().min(1) });
