export const emailTemplates = {
    testEmail: async (data) => ({
        templateName: 'test-email',
        subject: 'Test Email - InvoLuck API',
        getReplacements: (d) => ({
            timestamp: new Date().toISOString(),
            environment: d.environment || process.env.NODE_ENV || 'development',
        })
    }),

    database: async (data) => ({
        templateName: 'database-error',
        subject: 'Database Connection Failure Detected - InvoLuck API',
        getReplacements: (d) => ({
            status: d.connectionInfo?.status || 'Unknown',
            host: d.connectionInfo?.host || 'Unknown',
            readyState: d.connectionInfo?.readyState || 'Unknown',
            error: d.dbError,
            timestamp: new Date().toISOString()
        })
    }),

    recovery: async (data) => ({
        templateName: 'recovery-email',
        subject: 'Service Restored - InvoLuck API',
        getReplacements: (d) => ({
            timestamp: new Date().toISOString(),
            message: d.message || 'Service restored successfully'
        })
    }),
};
