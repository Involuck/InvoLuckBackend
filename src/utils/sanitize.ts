import mongoSanitize from 'express-mongo-sanitize';

// Sanitize object to prevent NoSQL injection
export const sanitizeObject = (obj: any): any => {
  return mongoSanitize.sanitize(obj);
};

// Sanitize string input
export const sanitizeString = (input: string): string => {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .substring(0, 10000); // Limit length
};

// Sanitize email input
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';

  return email.toLowerCase().trim().substring(0, 254); // Email max length per RFC
};

// Sanitize and validate MongoDB ObjectId
export const sanitizeObjectId = (id: string): string | null => {
  if (typeof id !== 'string') return null;

  const cleaned = id.trim();

  // Check if it matches ObjectId pattern (24 hex characters)
  if (!/^[a-fA-F0-9]{24}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
};

// Sanitize numeric input
export const sanitizeNumber = (input: any, defaultValue = 0): number => {
  const num = Number(input);

  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }

  return num;
};

// Sanitize boolean input
export const sanitizeBoolean = (input: any, defaultValue = false): boolean => {
  if (typeof input === 'boolean') return input;
  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }
  if (typeof input === 'number') {
    return input !== 0;
  }

  return defaultValue;
};

// Sanitize array input
export const sanitizeArray = (input: any, maxLength = 100): any[] => {
  if (!Array.isArray(input)) return [];

  return input.slice(0, maxLength).map(item => sanitizeObject(item));
};

// Remove undefined and null values from object
export const removeEmpty = (obj: Record<string, any>): Record<string, any> => {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const nestedCleaned = removeEmpty(value);
        if (Object.keys(nestedCleaned).length > 0) {
          cleaned[key] = nestedCleaned;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }

  return cleaned;
};

// Sanitize file name
export const sanitizeFileName = (fileName: string): string => {
  if (typeof fileName !== 'string') return 'unnamed';

  return fileName
    .trim()
    .replace(/[^a-zA-Z0-9.-_]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .substring(0, 255); // Limit length
};

// Sanitize URL
export const sanitizeUrl = (url: string): string | null => {
  if (typeof url !== 'string') return null;

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
};

// Escape HTML characters
export const escapeHtml = (input: string): string => {
  if (typeof input !== 'string') return '';

  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;'
  };

  return input.replace(/[&<>"'/]/g, match => htmlEscapes[match] || match);
};

// Comprehensive input sanitization middleware function
export const sanitizeInput = (input: any): any => {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeString(input);
  }

  if (typeof input === 'number') {
    return sanitizeNumber(input);
  }

  if (typeof input === 'boolean') {
    return input;
  }

  if (Array.isArray(input)) {
    return sanitizeArray(input);
  }

  if (typeof input === 'object') {
    return sanitizeObject(input);
  }

  return input;
};

export default {
  sanitizeObject,
  sanitizeString,
  sanitizeEmail,
  sanitizeObjectId,
  sanitizeNumber,
  sanitizeBoolean,
  sanitizeArray,
  removeEmpty,
  sanitizeFileName,
  sanitizeUrl,
  escapeHtml,
  sanitizeInput
};
