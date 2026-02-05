import { Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models/User';
import { Hospital } from '../models/Hospital';
import { Doctor } from '../models/Doctor';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { config } from '../config/index';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';

const createSlug = (name: string) => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const generateToken = (id: string, role: string, hospitalName?: string): string => {
    const payload = { id, role, hospitalName };
    const options: SignOptions = {
        expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, config.JWT_SECRET, options);
};

interface RegisterRequest extends AuthRequest {
    body: {
        name: string;
        email: string;
        password: string;
        role: string;
        hospitalName?: string;
    };
}

interface LoginRequest extends AuthRequest {
    body: {
        email: string;
        password: string;
    };
}

export const register = async (req: RegisterRequest, res: Response): Promise<void> => {
    try {
        const { name, email, password, role, hospitalName } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError('Email already registered', 400);
        }

        // Store user
        const user = await User.create({
            name,
            email,
            password,
            role,
            hospitalName,
        });

        // --- AUTO-SETUP LOGIC ---
        // If hospitalName is provided, ensure Hospital entity exists
        if (hospitalName) {
            let hospital = await Hospital.findOne({ name: hospitalName });

            if (!hospital) {
                // Create new hospital
                const slug = createSlug(hospitalName);

                // Check if slug exists, if so append random (though name check likely covers this)
                const existingSlug = await Hospital.findOne({ slug });
                const finalSlug = existingSlug ? `${slug}-${Math.floor(Math.random() * 1000)}` : slug;

                hospital = await Hospital.create({
                    name: hospitalName,
                    slug: finalSlug,
                    email: email, // Use creator's email temporarily
                    phone: '0000000000',
                    address: { street: '', city: 'City', state: 'State', zipCode: '', country: 'India' },
                    licenseNumber: `PENDING-${finalSlug.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
                    isActive: true
                });
                logger.info(`Created new hospital: ${hospital.name}`);
            }

            // If user is a Doctor, create Doctor profile
            if (role === 'doctor') {
                const splitName = name ? name.split(' ') : ['Doctor', 'User'];
                const firstName = splitName[0];
                const lastName = splitName.slice(1).join(' ') || 'Smith';

                await Doctor.create({
                    userId: user._id,
                    hospitalId: hospital._id,
                    firstName,
                    lastName,
                    specialization: 'General Physician', // Default
                    qualification: 'MBBS',
                    phone: '0000000000',
                    departmentId: new mongoose.Types.ObjectId(), // Dummy
                    licenseNumber: `DOC-${user._id.toString().substring(0, 6).toUpperCase()}`,
                    isActive: true
                });
                logger.info(`Created doctor profile for user: ${user._id}`);
            }
        }
        // --- END AUTO-SETUP ---

        const token = generateToken(user._id.toString(), user.role, user.hospitalName);

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    profileImage: user.profileImage,
                    hospitalName: user.hospitalName,
                    hospitalImage: user.hospitalImage,
                },
                token,
            },
        });
    } catch (error) {
        logger.error('Registration error:', error);
        throw error;
    }
};

export const login = async (req: LoginRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new ApiError('Invalid credentials', 401);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new ApiError('Invalid credentials', 401);
        }

        if (!user.isActive) {
            throw new ApiError('Account is deactivated', 401);
        }

        const token = generateToken(user._id.toString(), user.role, user.hospitalName);

        cache.del(`user:${user._id}`);

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    profileImage: user.profileImage,
                    hospitalName: user.hospitalName,
                    hospitalImage: user.hospitalImage,
                },
                token,
            },
        });
    } catch (error) {
        logger.error('Login error:', error);
        throw error;
    }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const cacheKey = `user:${req.user?.id}`;
        const cachedUser = cache.get(cacheKey);

        if (cachedUser) {
            res.json({
                success: true,
                data: cachedUser,
            });
            return;
        }

        const user = await User.findById(req.user?.id);
        if (!user) {
            throw new ApiError('User not found', 404);
        }

        cache.set(cacheKey, user);

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        throw error;
    }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        cache.del(`user:${req.user?.id}`);

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        logger.error('Logout error:', error);
        throw error;
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, experience, profileImage, hospitalImage } = req.body;
        const userId = req.user?.id;

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError('User not found', 404);
        }

        if (name !== undefined) user.name = name;
        if (experience !== undefined) user.experience = experience;
        if (profileImage !== undefined) user.profileImage = profileImage;
        if (hospitalImage !== undefined) user.hospitalImage = hospitalImage;

        await user.save();

        // Invalidate cache
        cache.del(`user:${userId}`);

        res.json({
            success: true,
            data: user,
            message: 'Profile updated successfully',
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        throw error;
    }
};

export const authController = {
    register,
    login,
    getProfile,
    updateProfile,
    logout,
};
