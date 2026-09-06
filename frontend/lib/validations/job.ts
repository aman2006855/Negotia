import { z } from 'zod';
import { JOB_CATEGORIES } from '../constants';

const CATEGORY_VALUES = JOB_CATEGORIES as unknown as [string, ...string[]];

export const createJobSchema = z.object({
  title: z
    .string()
    .min(4, 'Title must be at least 4 characters')
    .max(120, 'Title must be under 120 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(4000, 'Description must be under 4000 characters'),
  budgetCents: z
    .number()
    .min(100, 'Budget must be at least $1')
    .max(50000000, 'Budget must be under $500,000'),
  category: z
    .string()
    .refine((val) => JOB_CATEGORIES.includes(val as any), 'Please select a valid category'),
  agreementText: z
    .string()
    .min(20, 'Agreement must be at least 20 characters')
    .max(12000, 'Agreement must be under 12000 characters'),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
