import dotenv from 'dotenv';
dotenv.config();

export const config = {
    // Server
    PORT: parseInt(process.env.PORT || '5000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',

    // MongoDB
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/clinicflow',
    MONGODB_MAX_POOL_SIZE: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10', 10),
    MONGODB_MIN_POOL_SIZE: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2', 10),
    MONGODB_MAX_IDLE_TIME_MS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000', 10),
    MONGODB_CONNECT_TIMEOUT: parseInt(process.env.MONGODB_CONNECT_TIMEOUT || '10000', 10),

    // JWT
    JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),

    // Caching
    CACHE_TTL: parseInt(process.env.CACHE_TTL || '300', 10),

    // Logging
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
};
