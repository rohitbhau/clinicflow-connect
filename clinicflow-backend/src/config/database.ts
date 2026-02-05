import mongoose from 'mongoose';
import { config } from './index';
import { logger } from '../utils/logger';

class Database {
    private static instance: Database;
    private isConnected = false;

    private constructor() { }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    public async connect(): Promise<void> {
        if (this.isConnected) {
            logger.info('Using existing database connection');
            return;
        }

        const options = {
            maxPoolSize: config.MONGODB_MAX_POOL_SIZE,
            minPoolSize: config.MONGODB_MIN_POOL_SIZE,
            maxIdleTimeMS: config.MONGODB_MAX_IDLE_TIME_MS,
            connectTimeoutMS: config.MONGODB_CONNECT_TIMEOUT,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        };

        try {
            await mongoose.connect(config.MONGODB_URI, options);
            this.isConnected = true;
            logger.info('MongoDB connected successfully');

            mongoose.connection.on('error', (err) => {
                logger.error('MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                logger.warn('MongoDB disconnected');
                this.isConnected = false;
            });

            mongoose.connection.on('reconnected', () => {
                logger.info('MongoDB reconnected');
                this.isConnected = true;
            });

        } catch (error) {
            logger.error('Failed to connect to MongoDB:', error);
            throw error;
        }
    }

    public async disconnect(): Promise<void> {
        if (!this.isConnected) return;

        try {
            await mongoose.disconnect();
            this.isConnected = false;
            logger.info('MongoDB disconnected successfully');
        } catch (error) {
            logger.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }

    public getConnectionStatus(): boolean {
        return this.isConnected;
    }
}

export const db = Database.getInstance();
