import { z } from 'zod';

// Address schema (reusable)
export const addressSchema = z
  .object({
    street: z
      .string()
      .min(1, 'Street is required')
      .max(100, 'Street must not exceed 100 characters')
      .trim(),
    city: z
      .string()
      .min(1, 'City is required')
      .max(50, 'City must not exceed 50 characters')
      .trim(),
    state: z
      .string()
      .min(1, 'State is required')
      .max(50, 'State must not exceed 50 characters')
      .trim(),

    postalCode: z
      .string()
      .min(1, 'Postal code is required')
      .max(20, 'Postal code must not exceed 20 characters')
      .trim(),

    country: z
      .string()
      .min(1, 'Country is required')
      .max(50, 'Country must not exceed 50 characters')
      .trim()
  })
  .optional();

// Contact person schema
export const contactPersonSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Contact name is required')
      .max(50, 'Contact name must not exceed 50 characters')
      .trim(),

    email: z.string().email('Invalid email format').toLowerCase().trim().optional(),

    phone: z
      .string()
      .min(1, 'Phone number is required')
      .max(20, 'Phone number must not exceed 20 characters')
      .trim()
      .optional(),

    position: z.string().max(50, 'Position must not exceed 50 characters').trim().optional()
  })
  .optional();

// Create client schema
export const createClientSchema = z.object({
  name: z
    .string()
    .min(1, 'Client name is required')
    .max(100, 'Client name must not exceed 100 characters')
    .trim(),

  email: z.string().email('Invalid email format').toLowerCase().trim(),

  phone: z.string().max(20, 'Phone number must not exceed 20 characters').trim().optional(),

  company: z.string().max(100, 'Company name must not exceed 100 characters').trim().optional(),

  taxId: z.string().max(50, 'Tax ID must not exceed 50 characters').trim().optional(),

  website: z.string().url('Invalid website URL').optional().or(z.literal('')),

  notes: z.string().max(500, 'Notes must not exceed 500 characters').optional(),

  billingAddress: addressSchema,

  shippingAddress: addressSchema,

  contactPerson: contactPersonSchema,

  status: z.enum(['active', 'inactive', 'suspended']).default('active'),

  paymentTerms: z
    .number()
    .min(0, 'Payment terms must be non-negative')
    .max(365, 'Payment terms cannot exceed 365 days')
    .default(30),

  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code (e.g., USD)')
    .toUpperCase()
    .default('USD'),

  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').default([])
});

// Update client schema (all fields optional except restrictions)
export const updateClientSchema = createClientSchema
  .partial()
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  });

// Client query filters schema
export const clientQuerySchema = z.object({
  search: z.string().max(100, 'Search term must not exceed 100 characters').trim().optional(),

  status: z.enum(['active', 'inactive', 'suspended']).optional(),

  company: z.string().max(100, 'Company filter must not exceed 100 characters').trim().optional(),

  tags: z
    .string()
    .transform(str => str.split(',').map(tag => tag.trim()))
    .optional(),

  currency: z.string().length(3, 'Currency must be a 3-letter code').toUpperCase().optional(),

  createdAfter: z.string().datetime('Invalid date format').optional(),

  createdBefore: z.string().datetime('Invalid date format').optional(),

  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.enum(['name', 'email', 'company', 'createdAt', 'updatedAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc')
});

// Client ID parameter schema
export const clientParamsSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid client ID format')
});

// Bulk operations schema
export const bulkClientOperationSchema = z.object({
  operation: z.enum(['delete', 'activate', 'deactivate', 'suspend']),
  clientIds: z
    .array(z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid client ID format'))
    .min(1, 'At least one client ID required')
    .max(100, 'Maximum 100 clients can be processed at once')
});

// Import clients schema
export const importClientsSchema = z.object({
  clients: z
    .array(createClientSchema.omit({ status: true }))
    .min(1, 'At least one client required')
    .max(1000, 'Maximum 1000 clients can be imported at once'),

  skipDuplicates: z.boolean().default(true),
  updateExisting: z.boolean().default(false)
});

// Export types for TypeScript
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientQueryInput = z.infer<typeof clientQuerySchema>;
export type ClientParamsInput = z.infer<typeof clientParamsSchema>;
export type BulkClientOperationInput = z.infer<typeof bulkClientOperationSchema>;
export type ImportClientsInput = z.infer<typeof importClientsSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type ContactPersonInput = z.infer<typeof contactPersonSchema>;
