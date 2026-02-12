
import { Request, Response } from 'express';
import { Doctor } from '../models/Doctor';
import { Attendance } from '../models/Attendance';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Helper: Get Doctor from User
const getDoctor = async (userId: string) => {
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) throw new ApiError('Doctor profile not found', 404);
    return doctor;
};

export const checkIn = async (req: Request, res: Response) => {
    try {
        const doctor = await getDoctor(req.user.id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await Attendance.findOne({
            doctorId: doctor._id,
            date: today
        });

        if (existing) {
            throw new ApiError('Already checked in for today', 400);
        }

        const attendance = await Attendance.create({
            doctorId: doctor._id,
            date: today,
            checkIn: new Date(),
            status: 'present'
        });

        res.status(201).json({
            success: true,
            data: attendance,
            message: 'Checked in successfully'
        });

    } catch (error) {
        logger.error('Check-in error:', error);
        throw error;
    }
};

export const checkOut = async (req: Request, res: Response) => {
    try {
        const doctor = await getDoctor(req.user.id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            doctorId: doctor._id,
            date: today
        });

        if (!attendance) {
            throw new ApiError('You have not checked in today', 400);
        }

        if (attendance.checkOut) {
            throw new ApiError('Already checked out today', 400);
        }

        const now = new Date();
        const durationMs = now.getTime() - new Date(attendance.checkIn).getTime();
        const totalHours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));

        attendance.checkOut = now;
        attendance.totalHours = totalHours;
        await attendance.save();

        res.json({
            success: true,
            data: attendance,
            message: 'Checked out successfully'
        });

    } catch (error) {
        logger.error('Check-out error:', error);
        throw error;
    }
};

export const getStatus = async (req: Request, res: Response) => {
    try {
        const doctor = await getDoctor(req.user.id);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const attendance = await Attendance.findOne({
            doctorId: doctor._id,
            date: today
        });

        res.json({
            success: true,
            data: {
                checkedIn: !!attendance,
                checkedOut: !!attendance?.checkOut,
                checkInTime: attendance?.checkIn,
                checkOutTime: attendance?.checkOut,
                totalHours: attendance?.totalHours || 0
            }
        });

    } catch (error) {
        logger.error('Get status error:', error);
        throw error;
    }
};

export const getHistory = async (req: Request, res: Response) => {
    try {
        const doctor = await getDoctor(req.user.id);

        const history = await Attendance.find({ doctorId: doctor._id })
            .sort({ date: -1 })
            .limit(30);

        res.json({
            success: true,
            data: history
        });

    } catch (error) {
        logger.error('Get history error:', error);
        throw error;
    }
};

export const attendanceController = {
    checkIn,
    checkOut,
    getStatus,
    getHistory
};
