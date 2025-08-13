export const validateEnvironment = () => {
    const requiredVars = [
        'MONGO_URI',
        'CORS_ORIGINS',
        'API_SECRET_KEY'
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

export const isDevelopment = () => process.env.NODE_ENV !== 'production';
export const isProduction = () => process.env.NODE_ENV === 'production';