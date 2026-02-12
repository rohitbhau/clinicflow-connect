
import { Request, Response } from 'express';
import { Hospital } from '../models/Hospital';
import { User } from '../models/User';
import { Patient } from '../models/Patient';
import { ApiError } from '../middleware/errorHandler';

export const getStats = async (req: Request, res: Response) => {
    try {
        const totalHospitals = await Hospital.countDocuments();
        const totalUsers = await User.countDocuments();
        // Count users by role
        const admins = await User.countDocuments({ role: 'admin' });
        const doctors = await User.countDocuments({ role: 'doctor' });
        const patients = await User.countDocuments({ role: 'patient' });

        // Latest Hospitals
        const latestHospitals = await Hospital.find().sort({ createdAt: -1 }).limit(5);

        res.json({
            success: true,
            data: {
                hospitals: totalHospitals,
                users: totalUsers,
                admins,
                doctors,
                patients,
                recentHospitals: latestHospitals
            }
        });
    } catch (error) {
        throw error;
    }
};

export const getHospitals = async (req: Request, res: Response) => {
    try {
        const hospitals = await Hospital.find().sort({ createdAt: -1 });

        // Enhance with counts
        const data = await Promise.all(hospitals.map(async (h) => {
            const doctors = await User.countDocuments({ hospitalName: h.name, role: 'doctor' });
            const patients = await Patient.countDocuments({ hospitalId: h._id });
            const admins = await User.countDocuments({ hospitalName: h.name, role: 'admin' });

            const addressStr = h.address && typeof h.address === 'object'
                ? [h.address.street, h.address.city, h.address.state, h.address.country].filter(Boolean).join(', ')
                : (typeof h.address === 'string' ? h.address : "No Address");

            return {
                id: h._id,
                name: h.name,
                address: addressStr || "No Address",
                phone: h.phone,
                email: h.email,
                doctors,
                patients,
                admins,
                status: h.isActive ? 'active' : 'inactive',
                createdAt: h.createdAt
            };
        }));

        res.json({ success: true, data });
    } catch (error) {
        throw error;
    }
};

export const createHospital = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, address, licenseNumber, adminName, adminEmail, adminPassword } = req.body;

        // 1. Check existing
        const existingH = await Hospital.findOne({
            $or: [{ name }, { email }, { licenseNumber: licenseNumber || 'xxx' }]
        });
        if (existingH) {
            throw new ApiError('Hospital with this name, email, or license number already exists', 400);
        }

        const hospital = await Hospital.create({
            name,
            email,
            phone,
            licenseNumber: licenseNumber || `LIC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            address: typeof address === 'string' ? { street: address } : address,
            isActive: true,
            slug: name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000)
        });

        // 2. Create Admin User
        const existingU = await User.findOne({ email: adminEmail });
        if (existingU) {
            // Rollback hospital
            await Hospital.deleteOne({ _id: hospital._id });
            throw new ApiError('Admin email already exists', 400);
        }

        const user = await User.create({
            name: adminName,
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            hospitalName: name,
            isActive: true
        });

        res.status(201).json({ success: true, data: { hospital, admin: user } });
    } catch (error) {
        throw error;
    }
};

export const superAdminController = {
    getStats,
    getHospitals,
    createHospital
};
