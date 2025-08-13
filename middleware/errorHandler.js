import { isDevelopment } from '../config/environment.js';

const errorHandler = (err, req, res, next) => {
    console.error('🚨 Error:', err.message);

    if (err.message === "CORS policy violation") {
        return res.status(403).json({
            error: "CORS policy violation",
            message: "Origin not allowed"
        });
    }

    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            error: "Validation Error",
            details: errors
        });
    }

    /* More specific error handling can be added here */

    const status = err.status || err.statusCode || 500;

    res.status(status).json({
        error: "Internal Server Error",
        message: isDevelopment() ? err.message : "Something went wrong",
        ...(isDevelopment() && { stack: err.stack })
    });
};

export default errorHandler;