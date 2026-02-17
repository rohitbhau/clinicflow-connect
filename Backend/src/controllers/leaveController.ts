import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Doctor } from '../models/Doctor';
import { DoctorLeave } from '../models/DoctorLeave';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { Request } from 'express';

// ==================== Authenticated (Doctor) routes ====================

export const getLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) {
            throw new ApiError('Doctor profile not found', 404);
        }

        const { from, to } = req.query;

        const query: any = { doctorId: doctor._id };
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from as string);
            if (to) query.date.$lte = new Date(to as string);
        }

        const leaves = await DoctorLeave.find(query).sort({ date: 1 });

        res.json({
            success: true,
            data: leaves,
        });
    } catch (error) {
        logger.error('Get leaves error:', error);
        throw error;
    }
};

export const addLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) {
            throw new ApiError('Doctor profile not found', 404);
        }

        const { date, type, blockedSlots, reason } = req.body;

        if (!date || !type) {
            throw new ApiError('Date and type are required', 400);
        }

        if (type === 'slot' && (!blockedSlots || blockedSlots.length === 0)) {
            throw new ApiError('At least one slot is required for slot-type leave', 400);
        }

        const leaveDate = new Date(date);
        leaveDate.setHours(0, 0, 0, 0);

        // Check if a leave already exists for this date
        const existingLeave = await DoctorLeave.findOne({
            doctorId: doctor._id,
            date: leaveDate,
        });

        if (existingLeave) {
            // If existing is full-day, no point adding more
            if (existingLeave.type === 'full-day') {
                throw new ApiError('This date is already blocked as full-day leave', 400);
            }

            // If new one is full-day, replace existing
            if (type === 'full-day') {
                existingLeave.type = 'full-day';
                existingLeave.blockedSlots = [];
                existingLeave.reason = reason || existingLeave.reason;
                await existingLeave.save();

                res.json({
                    success: true,
                    data: existingLeave,
                    message: 'Leave updated to full-day',
                });
                return;
            }

            // Both are slot type — merge slots
            const mergedSlots = [...new Set([...existingLeave.blockedSlots, ...blockedSlots])];
            existingLeave.blockedSlots = mergedSlots;
            existingLeave.reason = reason || existingLeave.reason;
            await existingLeave.save();

            res.json({
                success: true,
                data: existingLeave,
                message: 'Blocked slots updated',
            });
            return;
        }

        // Create new leave
        const leave = await DoctorLeave.create({
            doctorId: doctor._id,
            date: leaveDate,
            type,
            blockedSlots: type === 'full-day' ? [] : blockedSlots,
            reason: reason || '',
        });

        res.status(201).json({
            success: true,
            data: leave,
            message: 'Leave added successfully',
        });
    } catch (error) {
        logger.error('Add leave error:', error);
        throw error;
    }
};

export const deleteLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) {
            throw new ApiError('Doctor profile not found', 404);
        }

        const { id } = req.params;

        const leave = await DoctorLeave.findOneAndDelete({
            _id: id,
            doctorId: doctor._id,
        });

        if (!leave) {
            throw new ApiError('Leave not found', 404);
        }

        res.json({
            success: true,
            message: 'Leave deleted successfully',
        });
    } catch (error) {
        logger.error('Delete leave error:', error);
        throw error;
    }
};

export const removeSlotFromLeave = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const doctor = await Doctor.findOne({ userId });
        if (!doctor) {
            throw new ApiError('Doctor profile not found', 404);
        }

        const { id } = req.params;
        const { slot } = req.body;

        if (!slot) {
            throw new ApiError('Slot is required', 400);
        }

        const leave = await DoctorLeave.findOne({
            _id: id,
            doctorId: doctor._id,
        });

        if (!leave) {
            throw new ApiError('Leave not found', 404);
        }

        if (leave.type === 'full-day') {
            throw new ApiError('Cannot remove a slot from full-day leave. Delete the leave instead.', 400);
        }

        leave.blockedSlots = leave.blockedSlots.filter(s => s !== slot);

        // If no slots left, delete the leave entry entirely
        if (leave.blockedSlots.length === 0) {
            await DoctorLeave.findByIdAndDelete(id);
            res.json({
                success: true,
                message: 'All slots removed, leave entry deleted',
            });
            return;
        }

        await leave.save();

        res.json({
            success: true,
            data: leave,
            message: 'Slot removed from leave',
        });
    } catch (error) {
        logger.error('Remove slot from leave error:', error);
        throw error;
    }
};

// ==================== Public route ====================

export const getBlockedDates = async (req: Request, res: Response): Promise<void> => {
    try {
        const { doctorId } = req.params;
        const { from, to } = req.query;

        const query: any = { doctorId };
        if (from || to) {
            query.date = {};
            if (from) query.date.$gte = new Date(from as string);
            if (to) query.date.$lte = new Date(to as string);
        }

        const leaves = await DoctorLeave.find(query).sort({ date: 1 });

        // Transform for public consumption
        const blockedDates = leaves.map(leave => ({
            date: leave.date.toISOString().split('T')[0],
            type: leave.type,
            blockedSlots: leave.blockedSlots,
        }));

        res.json({
            success: true,
            data: blockedDates,
        });
    } catch (error) {
        logger.error('Get blocked dates error:', error);
        throw error;
    }
};

export const leaveController = {
    getLeaves,
    addLeave,
    deleteLeave,
    removeSlotFromLeave,
    getBlockedDates,
};
