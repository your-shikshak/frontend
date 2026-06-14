import { z } from 'zod';
import { Gender, TeachingMode } from '@/types/enums';

// Tutor Lead Registration Schema
export const tutorLeadRegistrationSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  gender: z.string().min(1, 'Gender is required'),
  phoneNumber: z
    .string()
    .transform((v) => v.replace(/\D/g, ''))
    .refine((v) => /^\d{10}$/.test(v), 'Phone number must be 10 digits'),
  email: z.string().email('Invalid email format'),
  qualification: z.string().min(1, 'Qualification is required'),
  experience: z.string().min(1, 'Experience is required'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6),
  city: z.string().optional().default(''),
  preferredAreas: z.array(z.string()).optional().default([]),
  preferredMode: z.nativeEnum(TeachingMode),
  permanentAddress: z.string().optional(),
  residentialAddress: z.string().optional(),
  alternatePhone: z.string().optional(),
  bio: z.string().optional(),
  languagesKnown: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  daysAvailable: z.array(z.string()).optional().default([]),
  timeSlots: z.array(z.string()).optional().default([]),
}).superRefine((data, ctx) => {
  if (data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    });
  }

  if (!data.preferredMode) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['preferredMode'],
      message: 'Select a preferred mode',
    });
  }

  if (data.preferredMode === TeachingMode.OFFLINE || data.preferredMode === TeachingMode.HYBRID) {
    if (!data.city || data.city.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['city'],
        message: 'Please select a city',
      });
    }

    if (!data.preferredAreas || data.preferredAreas.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['preferredAreas'],
        message: 'Select at least one area',
      });
    }
  }
});

// Home Tutor Registration Schema (profile completion)
export const homeTutorRegistrationSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.literal('teacher'),
  provider: z.literal('local'),
  profile: z.object({
    firstName: z.string().min(1),
    lastName: z.string().optional(),
    phoneNumber: z
      .string()
      .optional()
      .transform((v) => (v ? v.replace(/\D/g, '') : v))
      .refine((v) => (v ? /^\d{10}$/.test(v) : true), 'Phone number must be 10 digits'),
    avatar: z.string().optional(),
    dateOfBirth: z
      .string()
      .optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    }).optional(),
  }),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  tutorLead: z.object({
    gender: z.nativeEnum(Gender).optional(),
    qualification: z.string().optional(),
    experience: z.string().optional(),
    subjects: z.array(z.string()).optional(),
    preferredAreas: z.array(z.string()).optional(),
    city: z.string().optional(),
    phoneNumber: z.string().optional(),
  }).optional(),
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type TutorLeadRegistrationInput = z.infer<typeof tutorLeadRegistrationSchema>;
export type HomeTutorRegistrationInput = z.infer<typeof homeTutorRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
