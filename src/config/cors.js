import cors from 'cors';
import { isDevelopment } from './environment.js';

const allowedOrigins = (process.env.CORS_ORIGINS || "").split(",").filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests without origin (direct browser access)
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        if (isDevelopment() && origin?.startsWith("http://localhost")) {
            return callback(null, true);
        }

        console.warn(`🚫 CORS blocked origin: ${origin}`);
        return callback(new Error("CORS policy violation"), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    optionsSuccessStatus: 200
};

export default cors(corsOptions);