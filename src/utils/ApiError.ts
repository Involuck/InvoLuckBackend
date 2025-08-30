export interface ErrorDetail {
  field?: string;
  message: string;
  code?: string | number;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: ErrorDetail[] = [];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    code?: string,
    details?: ErrorDetail[],
    isOperational = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.code = code || this.getDefaultCode(statusCode);
    this.details = details || [];
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  // Get default error code based on status code
  private getDefaultCode(statusCode: number): string {
    switch (statusCode) {
      case 400:
        return 'BAD_REQUEST';
      case 401:
        return 'UNAUTHORIZED';
      case 403:
        return 'FORBIDDEN';
      case 404:
        return 'NOT_FOUND';
      case 409:
        return 'CONFLICT';
      case 422:
        return 'VALIDATION_ERROR';
      case 429:
        return 'RATE_LIMIT_EXCEEDED';
      case 500:
        return 'INTERNAL_SERVER_ERROR';
      case 503:
        return 'SERVICE_UNAVAILABLE';
      default:
        return 'UNKNOWN_ERROR';
    }
  }

  // Convert error to JSON format for API responses
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode
    };
  }
}

// Static factory methods for common errors
export class ApiErrors {
  static badRequest(
    message = 'Bad request',
    options?: { code?: string; details?: ErrorDetail[] }
  ): ApiError {
    return new ApiError(400, message, options?.code, options?.details);
  }

  static unauthorized(
    message = 'Unauthorized access',
    options?: { code?: string; details?: ErrorDetail[] }
  ): ApiError {
    return new ApiError(401, message, options?.code ?? 'UNAUTHORIZED', options?.details);
  }

  static forbidden(
    message = 'Access forbidden',
    options?: { code?: string; details?: ErrorDetail[] }
  ): ApiError {
    return new ApiError(403, message, options?.code ?? 'FORBIDDEN', options?.details);
  }

  static notFound(
    resource = 'Resource',
    id?: string,
    options?: { code?: string; details?: ErrorDetail[] }
  ): ApiError {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    return new ApiError(404, message, options?.code ?? 'NOT_FOUND', options?.details);
  }

  static conflict(
    message = 'Resource conflict',
    options?: { code?: string; details?: ErrorDetail[] }
  ): ApiError {
    return new ApiError(409, message, options?.code ?? 'CONFLICT', options?.details);
  }

  static validation(message = 'Validation failed', details?: ErrorDetail[]): ApiError {
    return new ApiError(422, message, 'VALIDATION_ERROR', details);
  }

  static tooManyRequests(
    message = 'Too many requests',
    options?: { code?: string; details?: ErrorDetail[] }
  ): ApiError {
    return new ApiError(429, message, options?.code ?? 'RATE_LIMIT_EXCEEDED', options?.details);
  }

  static internal(
    message = 'Internal server error',
    options?: { code?: string; details?: ErrorDetail[] }
  ): ApiError {
    return new ApiError(500, message, options?.code ?? 'INTERNAL_SERVER_ERROR', options?.details);
  }

  static serviceUnavailable(
    message = 'Service temporarily unavailable',
    options?: { code?: string; details?: ErrorDetail[] }
  ): ApiError {
    return new ApiError(503, message, options?.code ?? 'SERVICE_UNAVAILABLE', options?.details);
  }

  static custom(
    statusCode: number,
    message: string,
    code?: string,
    details?: ErrorDetail[]
  ): ApiError {
    return new ApiError(statusCode, message, code, details);
  }
}

export default ApiError;
