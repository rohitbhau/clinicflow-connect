import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Doctor } from '../models/Doctor';
import { Appointment } from '../models/Appointment';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        // Find doctor profile associated with logged-in user
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) {
            throw new ApiError('Doctor profile not found', 404);
        }

        const { date } = req.query;
        let queryDate = new Date();

        if (date) {
            const parsedDate = new Date(date as string);
            if (!isNaN(parsedDate.getTime())) {
                queryDate = parsedDate;
            }
        }

        const startOfDay = new Date(queryDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(queryDate);
        endOfDay.setHours(23, 59, 59, 999);

        // 1. Fetch Today's Appointments
        const todayAppointments = await Appointment.find({
            doctorId: doctor._id,
            appointmentDate: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ startTime: 1 });

        // 2. Calculate Stats
        const appointmentsCount = todayAppointments.length;
        const pendingCount = todayAppointments.filter(a =>
            a.status === 'scheduled' || a.status === 'in-progress'
        ).length;

        // Revenue (sum of fees for completed/confirmed appointments today)
        // Adjust status check as needed for revenue rules
        const todayRevenue = todayAppointments
            .filter(a => a.status === 'completed')
            .reduce((sum, app) => sum + (app.fee || 0), 0);

        // 3. Total Patients
        const uniquePatients = await Appointment.distinct('patientName', { doctorId: doctor._id });
        const totalPatients = uniquePatients.length;

        // 4. Total Appointments (All time)
        const totalAppointments = await Appointment.countDocuments({ doctorId: doctor._id });

        res.json({
            success: true,
            data: {
                stats: {
                    todayAppointments: appointmentsCount,
                    pendingAppointments: pendingCount,
                    totalPatients: totalPatients,
                    todayRevenue: todayRevenue,
                    totalAppointments: totalAppointments
                },
                appointments: todayAppointments.map(app => ({
                    id: app._id,
                    patientName: app.patientName || 'Guest',
                    patientPhone: app.patientPhone || '',
                    date: app.appointmentDate.toISOString().split('T')[0],
                    time: app.startTime,
                    type: app.type,
                    status: app.status,
                    reason: app.reason,
                    tokenNumber: app.tokenNumber
                }))
            }
        });

    } catch (error) {
        logger.error('Get doctor dashboard stats error:', error);
        throw error;
    }
};

export const getUpcomingAppointments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) {
            throw new ApiError('Doctor profile not found', 404);
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const appointments = await Appointment.find({
            doctorId: doctor._id,
            appointmentDate: { $gte: startOfDay }
        }).sort({ appointmentDate: 1, startTime: 1 });

        res.json({
            success: true,
            data: appointments.map(app => ({
                id: app._id,
                patientName: app.patientName || 'Guest',
                patientPhone: app.patientPhone || '',
                date: app.appointmentDate.toISOString().split('T')[0],
                time: app.startTime,
                type: app.type,
                status: app.status,
                reason: app.reason,
                tokenNumber: app.tokenNumber
            }))
        });

    } catch (error) {
        logger.error('Get upcoming appointments error:', error);
        throw error;
    }
};

export const getPatients = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        // Find doctor profile associated with logged-in user
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) {
            throw new ApiError('Doctor profile not found', 404);
        }

        // Aggregation to find unique patients from appointments
        // We group by phone number as a unique identifier for now
        const patients = await Appointment.aggregate([
            { $match: { doctorId: doctor._id } },
            {
                $group: {
                    _id: "$patientPhone",
                    name: { $first: "$patientName" },
                    email: { $first: "$patientEmail" },
                    phone: { $first: "$patientPhone" },
                    lastVisit: { $max: "$appointmentDate" },
                    totalVisits: { $sum: 1 },
                    patientId: { $first: "$patientId" } // Keep reference if exists
                }
            },
            { $sort: { lastVisit: -1 } }
        ]);

        // Transform for frontend
        const formattedPatients = patients.map((p, index) => ({
            id: p.patientId || `temp-${index}`,
            name: p.name || 'Guest Patient',
            email: p.email || '',
            phone: p.phone || 'N/A',
            lastVisit: new Date(p.lastVisit).toLocaleDateString(),
            totalVisits: p.totalVisits,
            status: 'active', // Default status
            doctorId: doctor._id,
        }));

        res.json({
            success: true,
            data: formattedPatients
        });

    } catch (error) {
        logger.error('Get doctor patients error:', error);
        throw error;
    }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const doctor = await Doctor.findOne({ userId });

        if (!doctor) {
            throw new ApiError('Doctor profile not found', 404);
        }

        res.json({
            success: true,
            data: doctor
        });
    } catch (error) {
        logger.error('Get doctor profile error:', error);
        throw error;
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const updateData = req.body;

        // Prevent updating critical fields directly if needed, for now allow updates
        // Especially maxAppointmentsPerSlot

        const doctor = await Doctor.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!doctor) {
            throw new ApiError('Doctor profile not found', 404);
        }

        res.json({
            success: true,
            data: doctor,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        logger.error('Update doctor profile error:', error);
        throw error;
    }
};

export const doctorController = {
    getDashboardStats,
    getUpcomingAppointments,
    getPatients,
    getProfile,
    updateProfile
};
