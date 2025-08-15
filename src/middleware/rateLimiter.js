import rateLimit from 'express-rate-limit';

export default function rateLimiter() {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: process.env.NODE_ENV === 'production' ? 300 : 1000,
        message: {
            success: false,
            error: 'Too Many Requests',
            message: 'Rate limit exceeded. Please try again later.',
            retryAfter: '15 minutes',
            timestamp: new Date().toISOString()
        },
        standardHeaders: true,
        legacyHeaders: false,

        skip: (req) => {
            const publicPaths = ['/health-check', '/'];
            return publicPaths.includes(req.path);
        },

        handler: (req, res) => {
            console.log(`Rate limit exceeded`);
            res.status(429).json({
                success: false,
                error: 'Too Many Requests',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: '15 minutes',
                timestamp: new Date().toISOString(),
                path: req.path,
            });
        },
    });
}