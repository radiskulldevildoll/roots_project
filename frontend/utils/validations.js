import { z } from 'zod';

// ============================================
// Authentication Schemas
// ============================================

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// ============================================
// Person Schemas
// ============================================

export const personBasicSchema = z.object({
  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be at most 100 characters'),
  middle_name: z
    .string()
    .max(100, 'Middle name must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be at most 100 characters'),
});

export const personFullSchema = personBasicSchema.extend({
  maiden_name: z
    .string()
    .max(100, 'Maiden name must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  birth_date: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      if (!val) return true;
      const date = new Date(val);
      return !isNaN(date.getTime()) && date <= new Date();
    }, 'Birth date cannot be in the future'),
  birth_date_fuzzy: z
    .string()
    .max(50, 'Fuzzy date must be at most 50 characters')
    .optional()
    .or(z.literal('')),
  death_date: z
    .string()
    .optional()
    .or(z.literal('')),
  is_living: z.boolean().default(true),
  confidence_level: z
    .number()
    .min(0, 'Confidence level must be at least 0')
    .max(100, 'Confidence level must be at most 100')
    .default(100),
  bio: z
    .string()
    .max(5000, 'Biography must be at most 5000 characters')
    .optional()
    .or(z.literal('')),
}).refine((data) => {
  // If person is not living and death date is provided, ensure it's after birth date
  if (!data.is_living && data.death_date && data.birth_date) {
    const birth = new Date(data.birth_date);
    const death = new Date(data.death_date);
    return death >= birth;
  }
  return true;
}, {
  message: 'Death date must be after birth date',
  path: ['death_date'],
});

// ============================================
// Relationship Schemas
// ============================================

export const relationshipSchema = z.object({
  person_a: z.string().uuid('Invalid person ID'),
  person_b: z.string().uuid('Invalid person ID'),
  relationship_type: z.enum(['MAR', 'PAR', 'DIV', 'UNK'], {
    errorMap: () => ({ message: 'Please select a valid relationship type' }),
  }),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
}).refine((data) => data.person_a !== data.person_b, {
  message: 'Cannot create a relationship with the same person',
  path: ['person_b'],
});

export const parentChildLinkSchema = z.object({
  child: z.string().uuid('Invalid child ID'),
  single_parent: z.string().uuid('Invalid parent ID').optional().nullable(),
  relationship: z.number().optional().nullable(),
  link_type: z.enum(['BIO', 'ADO', 'FOS', 'STP'], {
    errorMap: () => ({ message: 'Please select a valid link type' }),
  }).default('BIO'),
}).refine((data) => data.single_parent || data.relationship, {
  message: 'Either a parent or a relationship must be specified',
  path: ['single_parent'],
});

// ============================================
// Story Schemas
// ============================================

export const storySchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  content: z
    .string()
    .min(1, 'Content is required')
    .max(50000, 'Content must be at most 50,000 characters'),
  event_date: z.string().optional().or(z.literal('')),
  event_date_fuzzy: z
    .string()
    .max(50, 'Fuzzy date must be at most 50 characters')
    .optional()
    .or(z.literal('')),
  is_public: z.boolean().default(false),
  tagged_people: z.array(z.string().uuid()).optional().default([]),
});

// ============================================
// Media Schemas
// ============================================

export const mediaSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be at most 200 characters'),
  description: z
    .string()
    .max(2000, 'Description must be at most 2000 characters')
    .optional()
    .or(z.literal('')),
  media_type: z.enum(['PHO', 'VID', 'DOC', 'AUD'], {
    errorMap: () => ({ message: 'Please select a valid media type' }),
  }).default('PHO'),
  media_date: z.string().optional().or(z.literal('')),
  media_date_fuzzy: z
    .string()
    .max(50, 'Fuzzy date must be at most 50 characters')
    .optional()
    .or(z.literal('')),
  location: z
    .string()
    .max(200, 'Location must be at most 200 characters')
    .optional()
    .or(z.literal('')),
  tagged_people: z.array(z.string().uuid()).optional().default([]),
});

// File upload validation (separate since it can't be a zod schema directly)
export const validateFile = (file, options = {}) => {
  const {
    maxSizeMB = 10,
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  } = options;

  const errors = [];

  if (!file) {
    errors.push('File is required');
    return { valid: false, errors };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    errors.push(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================
// Helper function for form error formatting
// ============================================

export const formatZodErrors = (errors) => {
  const formatted = {};
  errors.forEach((error) => {
    const path = error.path.join('.');
    if (!formatted[path]) {
      formatted[path] = error.message;
    }
  });
  return formatted;
};

// ============================================
// Type definitions (for documentation)
// ============================================

/**
 * @typedef {z.infer<typeof loginSchema>} LoginFormData
 * @typedef {z.infer<typeof registerSchema>} RegisterFormData
 * @typedef {z.infer<typeof personBasicSchema>} PersonBasicFormData
 * @typedef {z.infer<typeof personFullSchema>} PersonFullFormData
 * @typedef {z.infer<typeof storySchema>} StoryFormData
 * @typedef {z.infer<typeof mediaSchema>} MediaFormData
 */
