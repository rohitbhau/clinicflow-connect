import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import morgan from 'morgan';

import { config } from './config/index';
import { db } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';
import routes from './routes/index';
import uploadRoutes from './routes/uploadRoutes';
import { uploadsDir } from './routes/uploadRoutes';
import path from 'path';

const app: express.Application = express();

const allowedOrigins = [
    'https://cliniqmg.ropratech.com',
    'https://clinicmg.ropratech.com',
    'https://chic-vitality-production-e566.up.railway.app',
    'http://localhost:8080',
    ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [])
].map(origin => origin.trim());

const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked request from origin: ${origin}`);
            // For now, in production debugging, let's allow it but log it
            // callback(null, true); // Uncomment to force allow everything
            callback(null, false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    credentials: true,
    optionsSuccessStatus: 204
};

app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url} | Origin: ${req.headers.origin}`);
    next();
});

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:", "*"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
        }
    }
}));
app.use(compression());
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(mongoSanitize());
app.use(xss());

if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined', {
        stream: { write: (message: string) => logger.info(message.trim()) },
    }));
}

const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: db.getConnectionStatus() ? 'connected' : 'disconnected',
    });
});

app.use('/api/v1', routes);
app.use('/api/v1/upload', uploadRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir));

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        error: {
            message: 'Route not found',
            statusCode: 404,
        },
    });
});

app.use(errorHandler);

const startServer = async () => {
    try {
        await db.connect();

        app.listen(config.PORT, () => {
            logger.info(`Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
        });

        const gracefulShutdown = async (signal: string) => {
            logger.info(`${signal} received. Shutting down gracefully...`);

            await db.disconnect();

            process.exit(0);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

export default app;
