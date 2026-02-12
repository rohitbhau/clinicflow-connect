import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index';
import { ApiError } from './errorHandler';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        hospitalId?: string;
        hospitalName?: string;
    };
}

export const authenticate = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = (req as Request).headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new ApiError('No token provided', 401);
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, config.JWT_SECRET) as {
            id: string;
            role: string;
            hospitalId?: string;
            hospitalName?: string;
        };

        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new ApiError('Invalid token', 401));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(new ApiError('Token expired', 401));
        } else {
            next(error);
        }
    }
};

export const authorize = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            next(new ApiError('Not authenticated', 401));
            return;
        }

        if (!roles.includes(req.user.role)) {
            next(new ApiError('Not authorized to access this resource', 403));
            return;
        }

        next();
    };
};

export const optionalAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): void => {
    try {
        const authHeader = (req as Request).headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, config.JWT_SECRET) as {
                id: string;
                role: string;
                hospitalId?: string;
            };
            req.user = decoded;
        }

        next();
    } catch {
        next();
    }
};
