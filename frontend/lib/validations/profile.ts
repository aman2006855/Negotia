import { z } from 'zod';

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

const SOCIAL_URL_REGEX =
  /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?$/;

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .regex(
      /^[a-zA-ZÀ-ÿ\u00C0-\u024F\u1E00-\u1EFF\s.'-]+$/,
      'Name contains invalid characters'
    ),

  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be under 30 characters')
    .regex(USERNAME_REGEX, 'Only lowercase letters, numbers, and underscores allowed'),

  about: z
    .string()
    .max(500, 'About must be under 500 characters')
    .optional()
    .or(z.literal('')),

  avatar: z.string().url('Invalid avatar URL').max(500).optional().or(z.literal('')),

  coverPhotoUrl: z.string().url('Invalid cover URL').max(500).optional().or(z.literal('')),

  socialLinks: z
    .object({
      instagram: z.string().max(300).optional().or(z.literal('')),
      twitter: z.string().max(300).optional().or(z.literal('')),
      github: z.string().max(300).optional().or(z.literal('')),
      whatsapp: z.string().max(30).optional().or(z.literal('')),
      linkedin: z.string().max(300).optional().or(z.literal('')),
    })
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

/**
 * Validate a single field inline for real-time checks.
 * Returns null if valid, error string if invalid.
 */
export function validateField(
  field: keyof ProfileUpdateInput,
  value: string
): string | null {
  const result = profileUpdateSchema.shape[field].safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? 'Invalid value';
}

export function validateProfile(data: ProfileUpdateInput) {
  return profileUpdateSchema.safeParse(data);
}
