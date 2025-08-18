import dotenv from 'dotenv';

const result = dotenv.config();
if (result.error) {
    console.warn('⚠️  No .env file found or error loading it:', result.error.message);
}

// build config object
export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI,
    cors: {
        allowedOrigins: (process.env.CORS_ORIGINS || "")
            .split(",")
            .map(o => o.trim())
            .filter(Boolean)
    },

    email: {
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.FROM_EMAIL,
        adminEmail: process.env.ADMIN_EMAIL,
        isConfigured: !!(process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL)
    },

    jwtSecret: process.env.JWT_SECRET,
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 10,

    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX) || 100
};

// validate required environment variables
export const validateEnvironment = () => {
    const requiredVars = [
        'MONGO_URI',
        'CORS_ORIGINS',
        'API_SECRET_KEY',
        'RESEND_API_KEY',
        'ADMIN_EMAIL',
        'FROM_EMAIL',
        'JWT_SECRET'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error('❌ Missing required environment variables:');
        missingVars.forEach(varName => {
            console.error(`   - ${varName}`);
        });
        process.exit(1);
    }

    console.log('✅ Environment variables validated successfully');
};

// helpers
export const isDevelopment = () => config.nodeEnv !== 'production';
export const isProduction = () => config.nodeEnv === 'production';

export default config;