import { Response, Request } from 'express';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { Hospital } from '../models/Hospital';
import { Patient } from '../models/Patient';
import { Appointment } from '../models/Appointment';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const getHospitalUsers = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const hospitalName = req.user?.hospitalName;
        if (!hospitalName) {
            throw new ApiError('User is not associated with a hospital', 400);
        }

        // Fetch users (doctors and staff) associated with this hospital
        // Using explicit query to find other users with same hospitalName
        const users = await User.find({
            hospitalName: hospitalName,
            role: { $in: ['doctor', 'staff'] }
        });

        const enhancedUsers = await Promise.all(users.map(async (user) => {
            let details = {};
            if (user.role === 'doctor') {
                const docProfile = await Doctor.findOne({ userId: user._id });
                if (docProfile) {
                    details = {
                        specialization: docProfile.specialization,
                        phone: docProfile.phone,
                        status: docProfile.isActive ? 'active' : 'inactive'
                    };
                }
            } else {
                details = {
                    status: user.isActive ? 'active' : 'inactive'
                };
            }
            return {
                ...user.toObject(),
                id: user._id, // Ensure ID is compliant with frontend expectations
                ...details
            };
        }));

        res.json({
            success: true,
            data: enhancedUsers
        });
    } catch (error) {
        logger.error('Get hospital users error:', error);
        throw error; // Let centralized error handler manage it
    }
};



export const getHospitalBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const hospital = await Hospital.findOne({ slug });

        if (!hospital) {
            throw new ApiError('Hospital not found', 404);
        }

        const doctors = await Doctor.find({ hospitalId: hospital._id, isActive: true })
            .populate('userId', 'name email profileImage'); // Populate user details

        // Transform specific structure for frontend if needed
        const formattedDoctors = doctors.map(doc => ({
            _id: doc._id, // Use Doctor ID directly, not User ID
            userId: doc.userId._id, // Keep User ID reference if needed
            firstName: doc.firstName,
            lastName: doc.lastName,
            specialization: doc.specialization,
            qualification: doc.qualification,
            // ... add other necessary fields
        }));

        res.json({
            success: true,
            data: {
                hospital,
                doctors: formattedDoctors
            }
        });

    } catch (error) {
        logger.error('Get hospital public details error:', error);
        throw error;
    }
};

// ... (imports)

// ... (getHospitalUsers, getHospitalBySlug)

export const addHospitalUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, email, role, specialization, qualification, phone } = req.body;
        const hospitalName = req.user?.hospitalName;

        if (!hospitalName) {
            throw new ApiError('Admin not associated with a hospital', 400);
        }

        if (!['doctor', 'staff'].includes(role)) {
            throw new ApiError('Invalid role', 400);
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError('Email already registered', 400);
        }

        // Generate password
        const password = Math.random().toString(36).slice(-8);

        const newUser = await User.create({
            name,
            email,
            password,
            tempPassword: password,
            role,
            hospitalName,
            isActive: true
        });

        if (role === 'doctor') {
            const hospital = await Hospital.findOne({ name: hospitalName });
            if (!hospital) {
                // Should not happen if data integrity is good
                await User.deleteOne({ _id: newUser._id });
                throw new ApiError('Hospital not found', 404);
            }

            const splitName = name.split(' ');
            await Doctor.create({
                userId: newUser._id,
                hospitalId: hospital._id,
                firstName: splitName[0],
                lastName: splitName.slice(1).join(' ') || 'Doc',
                specialization: specialization || 'General',
                qualification: qualification || 'MBBS',
                phone: phone || '0000000000',
                licenseNumber: `DOC-${newUser._id.toString().substring(0, 6).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
                departmentId: new mongoose.Types.ObjectId(), // Placeholder
                isActive: true
            });
        }

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role
                },
                generatedPassword: password
            }
        });

    } catch (error) {
        logger.error('Add hospital user error:', error);
        throw error;
    }
};



export const getHospitalStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const hospitalName = req.user?.hospitalName;
        if (!hospitalName) {
            throw new ApiError('User is not associated with a hospital', 400);
        }

        const hospital = await Hospital.findOne({ name: hospitalName });
        if (!hospital) {
            throw new ApiError('Hospital not found', 404);
        }

        const [
            doctorCount,
            patientCount,
            todayAppointments,
            activeUsers
        ] = await Promise.all([
            User.countDocuments({ hospitalName, role: 'doctor', isActive: true }),
            Patient.countDocuments({ hospitalId: hospital._id }),
            Appointment.countDocuments({
                hospitalId: hospital._id,
                appointmentDate: {
                    $gte: new Date(new Date().setHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setHours(23, 59, 59, 999))
                }
            }),
            User.countDocuments({ hospitalName, isActive: true }) // Using active accounts as proxy for now
        ]);

        // Mock login activity for now as we don't have a LoginActivity model populated yet
        const recentActivity = await User.find({ hospitalName }).sort({ updatedAt: -1 }).limit(5).select('name role updatedAt');

        res.json({
            success: true,
            data: {
                hospital: {
                    id: hospital._id,
                    name: hospital.name,
                    slug: hospital.slug,
                    email: hospital.email,
                    phone: hospital.phone,
                    address: hospital.address,
                    status: hospital.isActive ? 'active' : 'inactive'
                },
                doctors: doctorCount,
                patients: patientCount,
                appointments: todayAppointments,
                online: Math.floor(activeUsers * 0.4) + 1, // Mock online users generally proportional to total
                loginActivity: recentActivity.map(u => ({
                    id: u._id,
                    userName: u.name,
                    role: u.role,
                    loginTime: u.updatedAt ? new Date(u.updatedAt).toLocaleTimeString() : 'Just now',
                    status: 'online'
                }))
            }
        });

    } catch (error) {
        logger.error('Get hospital stats error:', error);
        throw error;
    }
};

// ... (getHospitalStats)

export const deleteHospitalUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const hospitalName = req.user?.hospitalName;

        if (!hospitalName) {
            throw new ApiError('Admin not associated with a hospital', 400);
        }

        const userToDelete = await User.findOne({ _id: id, hospitalName });
        if (!userToDelete) {
            throw new ApiError('User not found in your hospital', 404);
        }

        await User.deleteOne({ _id: id });

        if (userToDelete.role === 'doctor') {
            await Doctor.deleteOne({ userId: id });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        logger.error('Delete hospital user error:', error);
        throw error;
    }
};

export const updatedUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active', 'on-leave', 'inactive'
        const hospitalName = req.user?.hospitalName;

        if (!hospitalName) {
            throw new ApiError('Admin not associated with a hospital', 400);
        }

        const userToUpdate = await User.findOne({ _id: id, hospitalName });
        if (!userToUpdate) {
            throw new ApiError('User not found in your hospital', 404);
        }

        // Map status to isActive boolean or keep string if we add status field to schema later.
        // For now, let's assuming 'active' = isActive: true, others false?
        // Or better, let's trust the frontend sends boolean or we interpret it.
        // Actually, the frontend sends "active" | "on-leave" | "inactive".
        // User model currently only has isActive: boolean.
        // Let's just update isActive for now, and if 'on-leave', maybe set isActive=false?
        // Wait, 'on-leave' implies they are still employed but temporarily away.
        // Let's rely on `isActive` for now. If status is 'inactive', isActive = false.
        // If 'active' or 'on-leave', isActive = true?
        // Re-checking Doctor model... it has isActive.
        // Let's assume status update is primarily for 'active'/'inactive' flag in User/Doctor.

        const isActive = status === 'active' || status === 'on-leave';

        userToUpdate.isActive = isActive;
        await userToUpdate.save();

        if (userToUpdate.role === 'doctor') {
            await Doctor.findOneAndUpdate({ userId: id }, { isActive });
        }

        res.json({
            success: true,
            message: `User status updated to ${status}`
        });

    } catch (error) {
        logger.error('Update user status error:', error);
        throw error;
    }
};

export const updateHospitalDetails = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const hospitalName = req.user?.hospitalName;
        if (!hospitalName) {
            throw new ApiError('User is not associated with a hospital', 400);
        }

        const { name, address, phone, status } = req.body;
        const hospital = await Hospital.findOne({ name: hospitalName });
        if (!hospital) {
            throw new ApiError('Hospital not found', 404);
        }

        if (phone) hospital.phone = phone;

        if (address) {
            // If address is string (from simple dialog), put it in street
            if (typeof address === 'string') {
                hospital.address = { ...hospital.address, street: address };
            } else if (typeof address === 'object') {
                hospital.address = { ...hospital.address, ...address };
            }
        }

        if (status && (status === 'active' || status === 'inactive')) {
            hospital.isActive = status === 'active';
        }

        // Handle Name Change
        if (name && name !== hospital.name) {
            const exists = await Hospital.findOne({ name });
            if (exists) throw new ApiError('Hospital name already exists', 400);

            const oldName = hospital.name;
            hospital.name = name;

            // Update all users associated with this hospital
            await User.updateMany({ hospitalName: oldName }, { hospitalName: name });
        }

        await hospital.save();

        res.json({
            success: true,
            data: hospital,
            message: 'Hospital details updated successfully'
        });

    } catch (error) {
        logger.error('Update hospital details error:', error);
        throw error;
    }
};

export const hospitalController = {
    getHospitalUsers,
    getHospitalBySlug,
    addHospitalUser,
    getHospitalStats,
    deleteHospitalUser,
    updatedUserStatus,
    updateHospitalDetails
};
