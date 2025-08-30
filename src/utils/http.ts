import type { Response } from 'express';

// Standard API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details: any[];
  };
  requestId: string;
  timestamp?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Send successful response with data
export const ok = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: ApiResponse['pagination']
): Response<ApiResponse<T>> => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    requestId: res.req.id.toString(),
    timestamp: new Date().toISOString()
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
};

// Send successful response for resource creation
export const created = <T>(res: Response, data: T, location?: string): Response<ApiResponse<T>> => {
  if (location) {
    res.location(location);
  }

  return ok(res, data, 201);
};

// Send successful response with no content
export const noContent = (res: Response): Response => {
  return res.status(204).end();
};

// Send error response
export const error = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details: any[] = []
): Response<ApiResponse> => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details
    },
    requestId: res.req.id.toString(),
    timestamp: new Date().toISOString()
  };

  return res.status(statusCode).json(response);
};

// Send bad request error (400)
export const badRequest = (
  res: Response,
  message = 'Bad request',
  details: any[] = []
): Response<ApiResponse> => {
  return error(res, 400, 'BAD_REQUEST', message, details);
};

// Send unauthorized error (401)
export const unauthorized = (
  res: Response,
  message = 'Unauthorized access'
): Response<ApiResponse> => {
  return error(res, 401, 'UNAUTHORIZED', message);
};

// Send forbidden error (403)
export const forbidden = (res: Response, message = 'Access forbidden'): Response<ApiResponse> => {
  return error(res, 403, 'FORBIDDEN', message);
};

// Send not found error (404)
export const notFound = (res: Response, message = 'Resource not found'): Response<ApiResponse> => {
  return error(res, 404, 'NOT_FOUND', message);
};

// Send validation error (422)
export const validationError = (
  res: Response,
  message = 'Validation failed',
  details: any[] = []
): Response<ApiResponse> => {
  return error(res, 422, 'VALIDATION_ERROR', message, details);
};

// Send internal server error (500)
export const internalError = (
  res: Response,
  message = 'Internal server error'
): Response<ApiResponse> => {
  return error(res, 500, 'INTERNAL_SERVER_ERROR', message);
};

// HTTP status code constants
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export default {
  ok,
  created,
  noContent,
  error,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  validationError,
  internalError,
  HttpStatus
};
