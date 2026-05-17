import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Enter your email, username, or phone number.')
    .max(254, 'That value is too long.'),
  password: z.string().min(1, 'Password is required.'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
});

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(20, 'Username must be at most 20 characters.')
  .regex(/^[a-zA-Z0-9_]+$/, 'Use letters, numbers, and underscores only.');

/** Empty, or 3–20 chars matching `usernameSchema`. */
const optionalUsernameSchema = z
  .string()
  .trim()
  .refine((s) => s.length === 0 || usernameSchema.safeParse(s).success, {
    message: 'Usernames use 3–20 letters, numbers, or underscores.',
  });

/** Empty, or a number with at least 10 digits (contact matching on Acts). */
export const optionalActsPhoneSchema = z
  .string()
  .trim()
  .max(32, 'That number looks too long.')
  .refine((s) => s.length === 0 || s.replace(/\D/g, '').length >= 10, {
    message: 'If you enter a number, use at least 10 digits (for contact matching on Acts).',
  });

export const signupSchema = z
  .object({
    username: optionalUsernameSchema,
    email: z.string().trim().email('Enter a valid email address.'),
    phone: optionalActsPhoneSchema,
    password: z.string().min(8, 'Use at least 8 characters.'),
    birthdate: z.date().optional(),
    profilePhotoUri: z.string().optional(),
  })
  .refine((data) => !data.birthdate || data.birthdate <= new Date(), {
    message: 'Date of birth cannot be in the future.',
    path: ['birthdate'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
