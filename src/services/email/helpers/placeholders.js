export const emailPlaceholders = {
  criticalErrorEmail: errorDetails => ({
    name: errorDetails.name,
    message: errorDetails.message,
    timestamp: errorDetails.timestamp,
    environment: errorDetails.environment,
    stack: errorDetails.stack || '',
    url: errorDetails.url,
    method: errorDetails.method,
    userAgent: errorDetails.userAgent,
    ip: errorDetails.ip
  }),

  databaseErrorEmail: dbInfo => ({
    status: dbInfo.status || 'Unknown',
    host: dbInfo.host || 'Unknown',
    readyState: dbInfo.readyState || 'Unknown',
    error: dbInfo.error || 'Unknown',
    timestamp: dbInfo.timestamp || new Date().toISOString()
  })
};
