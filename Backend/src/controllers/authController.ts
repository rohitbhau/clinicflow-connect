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
        hospitalPhone?: string;
        doctors?: any[];
        staff?: any[];
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
        const { name, email, password, role, hospitalName, doctors, staff, hospitalPhone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError('Email already registered', 400);
        }

        // --- HOSPITAL REGISTRATION FLOW ---
        if (role === 'admin' && hospitalName) {
            // 1. Create Admin User
            const user = await User.create({
                name: name || 'Hospital Admin',
                email,
                password,
                role: 'admin',
                hospitalName,
            });

            // 2. Create Hospital Entity
            const slug = createSlug(hospitalName);
            const existingSlug = await Hospital.findOne({ slug });
            const finalSlug = existingSlug ? `${slug}-${Math.floor(Math.random() * 1000)}` : slug;

            const hospital = await Hospital.create({
                name: hospitalName,
                slug: finalSlug,
                email: email,
                phone: hospitalPhone || '0000000000',
                address: { street: '', city: '', state: '', zipCode: '', country: 'India' },
                licenseNumber: `PENDING-${finalSlug.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
                isActive: true
            });

            const generatedCredentials: any[] = [];

            // 3. Process Doctors
            if (doctors && Array.isArray(doctors)) {
                for (const doc of doctors) {
                    const docPassword = Math.random().toString(36).slice(-8); // Generate 8 char password
                    const docUser = await User.create({
                        name: doc.name,
                        email: doc.email,
                        password: docPassword,
                        role: 'doctor',
                        hospitalName,
                        isActive: true
                    });

                    const splitName = doc.name ? doc.name.split(' ') : ['Doctor', 'User'];
                    await Doctor.create({
                        userId: docUser._id,
                        hospitalId: hospital._id,
                        firstName: splitName[0],
                        lastName: splitName.slice(1).join(' ') || 'Doc',
                        specialization: doc.specialization || 'General',
                        qualification: doc.qualification || 'MBBS',
                        phone: doc.phone || '0000000000',
                        licenseNumber: `DOC-${docUser._id.toString().substring(0, 6).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
                        departmentId: new mongoose.Types.ObjectId(), // Dummy
                        isActive: true
                    });

                    generatedCredentials.push({
                        name: doc.name,
                        email: doc.email,
                        password: docPassword,
                        role: 'doctor'
                    });
                }
            }

            // 4. Process Staff
            if (staff && Array.isArray(staff)) {
                for (const member of staff) {
                    const staffPassword = Math.random().toString(36).slice(-8);
                    await User.create({
                        name: member.name,
                        email: member.email,
                        password: staffPassword,
                        role: 'staff',
                        hospitalName,
                        isActive: true
                    });

                    generatedCredentials.push({
                        name: member.name,
                        email: member.email,
                        password: staffPassword,
                        role: 'staff'
                    });
                }
            }

            const token = generateToken(user._id.toString(), user.role, user.hospitalName);

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        name: user.name,
                        hospitalName: user.hospitalName,
                    },
                    token,
                    generatedCredentials // Return these so frontend can show them
                },
            });
            return;
        }

        // --- STANDARD REGISTRATION (Fallback) ---
        const user = await User.create({
            name,
            email,
            password,
            role,
            hospitalName,
        });

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
        // cleanup on failure
        const { role, hospitalName, email } = req.body;
        if (role === 'admin' && hospitalName) {
            const userCleanup = await User.findOne({ email });
            if (userCleanup) {
                await User.deleteOne({ _id: userCleanup._id });
                logger.info(`Cleaned up user ${email} after failed registration`);
            }
            const hospitalCleanup = await Hospital.findOne({ name: hospitalName });
            if (hospitalCleanup) {
                await Hospital.deleteOne({ _id: hospitalCleanup._id });
                logger.info(`Cleaned up hospital ${hospitalName} after failed registration`);
            }
            // Note: Doctors/Staff created in loop might remain if we don't track them,
            // but usually the first failure stops the loop.
            // For robustness we could track created IDs.
        }

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

        // Update last active time (using updatedAt for now)
        await User.findByIdAndUpdate(user._id, { updatedAt: new Date() });

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
