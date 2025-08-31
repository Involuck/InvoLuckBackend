import { z } from 'zod';

import type { Request } from 'express';

// Pagination query schema
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc')
});

// Pagination options interface
export interface PaginationOptions {
  page: number;
  limit: number;
  sort: string | undefined;
  order: 'asc' | 'desc';
  skip: number;
}

// Pagination metadata interface
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Parse pagination parameters from request query
export const parsePagination = (req: Request): PaginationOptions => {
  const parsed = paginationSchema.parse(req.query);

  return {
    page: parsed.page,
    limit: parsed.limit,
    sort: parsed.sort,
    order: parsed.order,
    skip: (parsed.page - 1) * parsed.limit
  };
};

// Generate pagination metadata
export const generatePaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

// Create Mongoose sort object from pagination options
export const createSortObject = (options: PaginationOptions): Record<string, 1 | -1> => {
  if (!options.sort) {
    return { createdAt: -1 }; // Default sort by creation date descending
  }

  const sortDirection = options.order === 'asc' ? 1 : -1;
  return { [options.sort]: sortDirection };
};

// Paginated result interface
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}

// Create paginated response helper
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  options: PaginationOptions
): PaginatedResult<T> => {
  const pagination = generatePaginationMeta(options.page, options.limit, total);

  return {
    data,
    pagination
  };
};

// Validate and sanitize sort field
export const sanitizeSortField = (
  sortField: string,
  allowedFields: string[]
): string | undefined => {
  if (!sortField) return undefined;

  // Remove any potential injection attempts
  const cleaned = sortField.replace(/[^a-zA-Z0-9_.]/g, '');

  // Check if field is in allowed list
  if (allowedFields.includes(cleaned)) {
    return cleaned;
  }

  return undefined;
};

// Get allowed sort fields for common models
export const CommonSortFields = {
  user: ['email', 'name', 'createdAt', 'updatedAt'],
  client: ['name', 'email', 'company', 'createdAt', 'updatedAt'],
  invoice: ['number', 'amount', 'status', 'dueDate', 'createdAt', 'updatedAt']
} as const;

export default {
  parsePagination,
  generatePaginationMeta,
  createSortObject,
  createPaginatedResponse,
  sanitizeSortField,
  CommonSortFields
};
