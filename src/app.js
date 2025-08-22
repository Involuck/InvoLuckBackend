import express from 'express';
import cors from "cors";
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB, { getConnectionStatus } from './config/database.js';
import securityMiddleware from './middleware/security.js';
import errorHandler from './middleware/errorHandler.js';
import rateLimiter from './middleware/rateLimiter.js';
import routes from './routes/index.js';
import authRoute from './routes/authRoutes.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({
  origin: process.env.CORS_ORIGINS.split(","),
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use("/auth", authRoute);


try {
    await connectDB();
} catch (error) {
    console.error('❌ Failed to connect to database on startup:', error.message);
    // the app may continue to work, it will attempt to reconnect automatically.
}

// log requests in development
if (process.env.NODE_ENV !== 'production') {
    const { default: morgan } = await import('morgan');
    app.use(morgan('dev'));
}

app.get('/', (req, res) => {
    const acceptsHTML = req.headers.accept?.includes('text/html');
    if (acceptsHTML) {
        return res.sendFile(path.join(__dirname, '../public', 'index.html'));
    }
    return res.json({
        message: '🚀 InvoLuck API is running...',
        version: '1.0.0',
        status: 'active',
        note: 'API routes are protected by security middleware'
    });
});

app.get('/health-check', async (req, res) => {
    let responseStatus = 200;

    const dbInfo = getConnectionStatus();
    let dbStatus = dbInfo.status;
    let dbError = null;

    // check if the database is connected, if not, try to connect
    if (dbStatus !== 'connected') {
        try {
            await connectDB();
            dbStatus = 'connected';
        } catch (err) {
            dbError = err.message;
            dbStatus = 'error';
            responseStatus = 503;
        }
    }

    const healthData = {
        status: dbStatus === 'connected' ? 'OK' : 'ERROR',
        api: dbStatus === 'connected' ? 'running' : 'not-ready',
        database: {
            status: dbStatus,
            readyState: dbInfo.readyState,
            host: dbInfo.host,
            error: dbError
        },
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        environment: process.env.NODE_ENV || 'development',
    };

    res.status(responseStatus).json(healthData);
});

app.use('/api',
    rateLimiter(),
    securityMiddleware,
    routes
);

// CORS configuration
// app.use(cors({
//     origin: process.env.CORS_ORIGINS.split(","),
//     credentials: true
// }));


// not found handler
app.use('*', (req, res) => {
    const isApiRoute = req.originalUrl.startsWith('/api');
    const acceptsHTML = req.headers.accept?.includes('text/html');

    if (isApiRoute || !acceptsHTML) {
        return res.status(404).json({
            success: false,
            error: isApiRoute ? 'API Endpoint Not Found' : 'Resource Not Found',
            message: `The route ${req.method} ${req.originalUrl} does not exist`,
            timestamp: new Date().toISOString(),
            path: req.originalUrl
        });
    }

    return res.status(404).sendFile(
        path.join(__dirname, '../public', '404.html')
    );
});

app.use(errorHandler);

export default app;