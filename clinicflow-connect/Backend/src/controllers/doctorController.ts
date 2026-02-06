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

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
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

export const doctorController = {
    getDashboardStats
};
