import { z } from 'zod';

export const invoiceItemSchema = z.object({
  description: z
    .string()
    .min(1, 'Item description is required')
    .max(500, 'Description must not exceed 500 characters')
    .trim(),

  quantity: z
    .number()
    .min(0.01, 'Quantity must be greater than 0')
    .max(999999.99, 'Quantity too large'),

  unitPrice: z
    .number()
    .min(0, 'Unit price must be non-negative')
    .max(999999.99, 'Unit price too large'),

  taxRate: z
    .number()
    .min(0, 'Tax rate must be non-negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .default(0),

  discount: z
    .number()
    .min(0, 'Discount must be non-negative')
    .max(100, 'Discount cannot exceed 100%')
    .default(0),

  category: z.string().max(50, 'Category must not exceed 50 characters').trim().optional(),

  unit: z.string().max(20, 'Unit must not exceed 20 characters').trim().optional()
});

// Payment terms schema
export const paymentTermsSchema = z.object({
  dueDate: z.string().datetime('Invalid due date format').or(z.date()),

  lateFee: z.number().min(0, 'Late fee must be non-negative').default(0),

  discountRate: z
    .number()
    .min(0, 'Early payment discount must be non-negative')
    .max(100, 'Discount cannot exceed 100%')
    .default(0),

  discountDays: z.number().min(0, 'Discount days must be non-negative').default(0),

  paymentMethods: z
    .array(z.enum(['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other']))
    .default(['bank_transfer'])
});

// Create invoice schema
export const createInvoiceSchema = z
  .object({
    clientId: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid client ID format'),

    number: z
      .string()
      .min(1, 'Invoice number is required')
      .max(50, 'Invoice number must not exceed 50 characters')
      .trim()
      .optional(), // Can be auto-generated

    issueDate: z
      .string()
      .datetime('Invalid issue date format')
      .or(z.date())
      .default(() => new Date().toISOString()),

    dueDate: z.string().datetime('Invalid due date format').or(z.date()),

    items: z
      .array(invoiceItemSchema)
      .min(1, 'At least one item is required')
      .max(100, 'Maximum 100 items allowed'),

    notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),

    terms: z.string().max(1000, 'Terms must not exceed 1000 characters').optional(),

    currency: z
      .string()
      .length(3, 'Currency must be a 3-letter code (e.g., USD)')
      .toUpperCase()
      .default('USD'),

    status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).default('draft'),

    taxRate: z
      .number()
      .min(0, 'Tax rate must be non-negative')
      .max(100, 'Tax rate cannot exceed 100%')
      .default(0),

    discountType: z.enum(['percentage', 'fixed']).default('percentage'),

    discountValue: z.number().min(0, 'Discount value must be non-negative').default(0),

    shippingCost: z.number().min(0, 'Shipping cost must be non-negative').default(0),

    paymentTerms: paymentTermsSchema.optional(),

    tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').default([]),

    metadata: z.record(z.any()).optional()
  })
  .refine(
    data => {
      const issueDate = new Date(data.issueDate);
      const dueDate = new Date(data.dueDate);
      return dueDate >= issueDate;
    },
    {
      message: 'Due date must be on or after issue date',
      path: ['dueDate']
    }
  );

// Update invoice schema
export const updateInvoiceSchema = z
  .object({
    number: z
      .string()
      .min(1, 'Invoice number is required')
      .max(50, 'Invoice number must not exceed 50 characters')
      .trim()
      .optional(),

    issueDate: z.string().datetime('Invalid issue date format').or(z.date()).optional(),

    dueDate: z.string().datetime('Invalid due date format').or(z.date()).optional(),

    items: z
      .array(invoiceItemSchema)
      .min(1, 'At least one item is required')
      .max(100, 'Maximum 100 items allowed')
      .optional(),

    notes: z.string().max(1000, 'Notes must not exceed 1000 characters').optional(),

    terms: z.string().max(1000, 'Terms must not exceed 1000 characters').optional(),

    currency: z
      .string()
      .length(3, 'Currency must be a 3-letter code (e.g., USD)')
      .toUpperCase()
      .optional(),

    status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).optional(),

    taxRate: z
      .number()
      .min(0, 'Tax rate must be non-negative')
      .max(100, 'Tax rate cannot exceed 100%')
      .optional(),

    discountType: z.enum(['percentage', 'fixed']).optional(),

    discountValue: z.number().min(0, 'Discount value must be non-negative').optional(),

    shippingCost: z.number().min(0, 'Shipping cost must be non-negative').optional(),

    paymentTerms: paymentTermsSchema.optional(),

    tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional(),

    metadata: z.record(z.any()).optional()
  })
  .refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  });

// Invoice status update schema
export const updateInvoiceStatusSchema = z
  .object({
    status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']),
    paidDate: z.string().datetime('Invalid paid date format').or(z.date()).optional(),
    paymentMethod: z
      .enum(['cash', 'check', 'credit_card', 'bank_transfer', 'paypal', 'other'])
      .optional(),
    paymentReference: z
      .string()
      .max(100, 'Payment reference must not exceed 100 characters')
      .optional()
  })
  .refine(
    data => {
      if (data.status === 'paid') {
        return data.paidDate !== undefined;
      }
      return true;
    },
    {
      message: 'Paid date is required when status is paid',
      path: ['paidDate']
    }
  );

// Invoice query filters schema
export const invoiceQuerySchema = z
  .object({
    search: z.string().max(100, 'Search term must not exceed 100 characters').trim().optional(),

    clientId: z
      .string()
      .regex(/^[a-fA-F0-9]{24}$/, 'Invalid client ID format')
      .optional(),

    status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).optional(),

    currency: z.string().length(3, 'Currency must be a 3-letter code').toUpperCase().optional(),

    minAmount: z.coerce.number().min(0, 'Minimum amount must be non-negative').optional(),

    maxAmount: z.coerce.number().min(0, 'Maximum amount must be non-negative').optional(),

    issuedAfter: z.string().datetime('Invalid date format').optional(),

    issuedBefore: z.string().datetime('Invalid date format').optional(),

    dueAfter: z.string().datetime('Invalid date format').optional(),

    dueBefore: z.string().datetime('Invalid date format').optional(),

    tags: z
      .string()
      .transform(str => str.split(',').map(tag => tag.trim()))
      .optional(),

    // Pagination
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    sort: z
      .enum(['number', 'issueDate', 'dueDate', 'amount', 'status', 'createdAt'])
      .default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc')
  })
  .refine(
    data => {
      if (data.minAmount && data.maxAmount) {
        return data.maxAmount >= data.minAmount;
      }
      return true;
    },
    {
      message: 'Maximum amount must be greater than or equal to minimum amount',
      path: ['maxAmount']
    }
  );

// Invoice ID parameter schema
export const invoiceParamsSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid invoice ID format')
});

// Send invoice schema
export const sendInvoiceSchema = z.object({
  to: z
    .array(z.string().email())
    .min(1, 'At least one recipient email required')
    .max(10, 'Maximum 10 recipients allowed'),

  cc: z.array(z.string().email()).max(5, 'Maximum 5 CC recipients allowed').optional(),

  subject: z
    .string()
    .min(1, 'Email subject is required')
    .max(200, 'Subject must not exceed 200 characters')
    .optional(),

  message: z.string().max(2000, 'Message must not exceed 2000 characters').optional(),

  sendReminder: z.boolean().default(false),
  reminderDays: z.number().min(1).max(30).optional()
});

// Invoice analytics filters schema
export const invoiceAnalyticsSchema = z.object({
  period: z.enum(['week', 'month', 'quarter', 'year', 'custom']).default('month'),

  startDate: z.string().datetime('Invalid start date format').optional(),

  endDate: z.string().datetime('Invalid end date format').optional(),

  clientId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid client ID format')
    .optional(),

  currency: z.string().length(3, 'Currency must be a 3-letter code').toUpperCase().optional(),

  groupBy: z.enum(['day', 'week', 'month', 'client', 'status']).default('month')
});

// Export types for TypeScript
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type PaymentTermsInput = z.infer<typeof paymentTermsSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type UpdateInvoiceStatusInput = z.infer<typeof updateInvoiceStatusSchema>;
export type InvoiceQueryInput = z.infer<typeof invoiceQuerySchema>;
export type InvoiceParamsInput = z.infer<typeof invoiceParamsSchema>;
export type SendInvoiceInput = z.infer<typeof sendInvoiceSchema>;
export type InvoiceAnalyticsInput = z.infer<typeof invoiceAnalyticsSchema>;
