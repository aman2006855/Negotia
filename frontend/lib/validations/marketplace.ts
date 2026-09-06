import { z } from 'zod';
import { MARKET_CATEGORIES } from '../constants';

export const createListingSchema = z.object({
  kind: z.enum(['SALE', 'SHOWCASE']),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be under 120 characters'),
  category: z
    .string()
    .refine((val) => MARKET_CATEGORIES.includes(val as any), 'Please select a valid category'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(4000, 'Description must be under 4000 characters'),
  techStack: z.array(z.string()).max(12, 'Max 12 tech badges'),
  previewUrl: z
    .string()
    .url('Must be a valid URL (https://...)')
    .optional()
    .or(z.literal('')),
  thumbnailUrl: z
    .string()
    .optional()
    .or(z.literal('')),
  priceCents: z
    .number()
    .int()
    .min(100, 'Price must be at least $1')
    .max(100000000, 'Price must be under $1,000,000')
    .optional(),
  currency: z.enum(['USD', 'INR']),
  pricingModel: z.enum(['FIXED', 'SUBSCRIPTION']),
  deliveryUrl: z
    .string()
    .url('Delivery link must be a valid URL')
    .optional()
    .or(z.literal('')),
}).superRefine((val, ctx) => {
  if (val.kind === 'SALE' && (!val.priceCents || val.priceCents <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['priceCents'], message: 'Price is required for items For Sale' });
  }
});

export type CreateListingInput = z.infer<typeof createListingSchema>;
