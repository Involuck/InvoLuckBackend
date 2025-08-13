import { isDevelopment } from '../config/environment.js';

const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);

const publicRoutes = [
    '/',
    '/favicon.ico',
    '/robots.txt',
    '/health-check',
];

const securityMiddleware = (req, res, next) => {
    const origin = req.get("origin");
    const apiKey = req.get("X-API-Key");
    const userAgent = req.get("User-Agent");
    const path = req.path;

    if (isDevelopment()) {
        console.log(`📝 ${req.method} ${req.path} from ${origin || 'No origin'}`);
    }

    if (publicRoutes.includes(path)) {
        return next();
    }
    // block suspicious user-agents
    if (userAgent && /bot|crawler|spider|scraper/i.test(userAgent)) {
        return res.status(403).json({
            error: "Access denied",
            code: "FORBIDDEN_USER_AGENT"
        });
    }

    if (!apiKey) {
        return res.status(401).json({
            error: "API key required",
            code: "API_KEY_MISSING"
        });
    }

    const validApiKeys = [process.env.API_SECRET_KEY];

    if (!validApiKeys.includes(apiKey)) {
        return res.status(401).json({
            error: "Invalid API key",
            code: "API_KEY_INVALID"
        });
    }

    if (allowedOrigins.includes(origin)) {
        return next();
    }

    if (isDevelopment() && origin?.startsWith("http://localhost")) {
        return next();
    }

    return res.status(403).json({
        error: "Origin not allowed",
        code: "ORIGIN_NOT_ALLOWED"
    });
};

export default securityMiddleware;