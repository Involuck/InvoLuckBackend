import { isDevelopment } from '../config/environment.js';

const errorHandler = (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;

    if (isDevelopment()) {
        console.error(`[${req.method}] ${req.originalUrl}`);
        console.error(`Message: ${err.message}`);
        if (err.stack) console.error(err.stack);
    } else {
        console.error(`${status} - ${err.message}`);
    }

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

    if (err.name === 'CastError') {
        return res.status(400).json({
            error: "Invalid ID format",
            field: err.path
        });
    }

    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return res.status(400).json({
            error: "Invalid JSON format"
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: "Invalid token"
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: "Token expired"
        });
    }

    res.status(status).json({
        error: err.error || "Internal Server Error",
        message: isDevelopment() ? err.message : "Something went wrong",
        ...(isDevelopment() && { stack: err.stack })
    });
};

export default errorHandler;