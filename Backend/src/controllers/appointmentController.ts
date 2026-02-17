import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Appointment } from '../models/Appointment';
import { Doctor } from '../models/Doctor';
import { Hospital } from '../models/Hospital';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';
import { DoctorLeave } from '../models/DoctorLeave';

// Helper to find doctor by ID or User ID
const findDoctor = async (id: string) => {
    // Check if the ID is a valid ObjectId format. If not, it cannot be a Doctor _id.
    // It might still be a userId, but we'll try findOne({ userId: id }) next.
    // For now, if it's not a valid ObjectId, we assume it's not a Doctor _id.
    // If it's not a valid ObjectId, and not a userId, then it's not a doctor.

    // Try finding by Doctor ID
    let doctor = await Doctor.findById(id);
    if (doctor) return doctor;

    // If not found by _id, try finding by User ID assoc with Doctor
    // This handles cases where the ID passed might be the user's ID, not the doctor's document ID.
    doctor = await Doctor.findOne({ userId: id });
    return doctor;
};

export const bookAppointment = async (req: Request, res: Response): Promise<void> => {
    try {
        const {
            doctorId,
            patientName,
            email,
            phone,
            date,
            time,
            appointmentType,
            notes,
        } = req.body;

        // In a real app, strict validation here.
        if (!doctorId || !patientName || !date || !time) {
            throw new ApiError('Missing required fields', 400);
        }

        const doctor = await findDoctor(doctorId);

        if (!doctor) {
            throw new ApiError('Doctor not found', 404);
        }

        // Generate Token Number for this Doctor + Date
        const dateObj = new Date(date);
        const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD

        // Doctor Initials
        const firstNameInitial = doctor.firstName ? doctor.firstName.charAt(0).toUpperCase() : '';
        const lastNameInitial = doctor.lastName ? doctor.lastName.charAt(0).toUpperCase() : '';
        const doctorInitials = (firstNameInitial + lastNameInitial) || 'DR';

        // Check for doctor leave / blocked dates
        const leaveDate = new Date(date);
        leaveDate.setHours(0, 0, 0, 0);

        const leave = await DoctorLeave.findOne({
            doctorId: doctor._id,
            date: leaveDate,
        });

        if (leave) {
            if (leave.type === 'full-day') {
                throw new ApiError('Doctor is not available on this date. Please choose a different date.', 400);
            }
            if (leave.type === 'slot' && leave.blockedSlots.includes(time)) {
                throw new ApiError('This time slot is blocked by the doctor. Please choose a different slot.', 400);
            }
        }

        // Check for max appointments per slot
        const maxAppointments = doctor.maxAppointmentsPerSlot || 5;

        // Check how many appointments already exist for this slot
        const existingAppointmentsCount = await Appointment.countDocuments({
            doctorId: doctor._id,
            appointmentDate: new Date(date),
            startTime: time,
            status: { $ne: 'cancelled' }
        });

        if (existingAppointmentsCount >= maxAppointments) {
            throw new ApiError('Appointment slot is already full. Please choose a different slot.', 400);
        }

        // Count appointments for this doctor on this day
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Find last appointment to determine next serial
        const lastAppointment = await Appointment.findOne({
            doctorId: doctor._id,
            appointmentDate: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        }).sort({ tokenNumber: -1 });

        let nextSerial = 1;
        if (lastAppointment && lastAppointment.tokenNumber) {
            const parts = lastAppointment.tokenNumber.split('-');
            if (parts.length === 3) {
                const lastSerial = parseInt(parts[2], 10);
                if (!isNaN(lastSerial)) {
                    nextSerial = lastSerial + 1;
                }
            }
        }

        const serialNumber = nextSerial.toString().padStart(3, '0');
        const tokenNumber = `${dateStr}-${doctorInitials}-${serialNumber}`;

        const appointment = await Appointment.create({
            doctorId: doctor._id,
            hospitalId: doctor.hospitalId,
            patientName,
            patientEmail: email,
            patientPhone: phone,
            appointmentDate: new Date(date),
            startTime: time,
            endTime: time, // Logic for duration could be added
            type: appointmentType.toLowerCase(), // Ensure lowercase match with enum
            reason: appointmentType, // Using type as reason for now
            notes,
            status: 'scheduled',
            tokenNumber,
        });

        res.status(201).json({
            success: true,
            data: appointment,
            message: 'Appointment booked successfully',
        });

    } catch (error) {
        logger.error('Book appointment error:', error);
        throw error;
    }
};

export const getQueueStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { doctorId } = req.params;

        const doctor = await findDoctor(doctorId);

        if (!doctor) {
            throw new ApiError('Doctor not found', 404);
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch Current Serving
        const currentAppointment = await Appointment.findOne({
            doctorId: doctor._id,
            status: 'in-progress',
            appointmentDate: { $gte: startOfDay, $lte: endOfDay }
        }).sort({ updatedAt: -1 }); // Recently updated to in-progress

        // Fetch Up Next
        const nextAppointments = await Appointment.find({
            doctorId: doctor._id,
            status: 'scheduled',
            appointmentDate: { $gte: startOfDay, $lte: endOfDay }
        })
            .sort({ tokenNumber: 1 }) // Sequential token order
            .limit(5);

        res.json({
            success: true,
            data: {
                current: currentAppointment ? {
                    tokenNumber: currentAppointment.tokenNumber,
                    patientName: currentAppointment.patientName || "Unknown", // Handle guest vs registered later
                    _id: currentAppointment._id
                } : null,
                queue: nextAppointments.map(app => ({
                    tokenNumber: app.tokenNumber,
                    patientName: app.patientName || "Unknown",
                    _id: app._id
                })),
                doctor: {
                    name: `${doctor.firstName} ${doctor.lastName}`,
                    specialization: doctor.specialization
                }
            }
        });

    } catch (error) {
        logger.error('Get queue status error:', error);
        throw error;
    }
};

export const getAllQueuesStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { hospitalId } = req.params;

        // Get all doctors for this hospital
        const doctors = await Doctor.find({ hospitalId });

        if (!doctors || doctors.length === 0) {
            res.json({
                success: true,
                data: {
                    queues: [],
                    hospitalId
                }
            });
            return;
        }

        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Fetch queue status for all doctors
        const queues = await Promise.all(doctors.map(async (doctor) => {
            // Fetch Current Serving
            const currentAppointment = await Appointment.findOne({
                doctorId: doctor._id,
                status: 'in-progress',
                appointmentDate: { $gte: startOfDay, $lte: endOfDay }
            }).sort({ updatedAt: -1 });

            // Fetch Waiting Queue
            const waitingAppointments = await Appointment.find({
                doctorId: doctor._id,
                status: 'scheduled',
                appointmentDate: { $gte: startOfDay, $lte: endOfDay }
            }).sort({ tokenNumber: 1 }).limit(10);

            return {
                doctor: {
                    id: doctor._id,
                    name: `${doctor.firstName} ${doctor.lastName}`,
                    specialization: doctor.specialization
                },
                current: currentAppointment ? {
                    tokenNumber: currentAppointment.tokenNumber,
                    patientName: currentAppointment.patientName || "Unknown",
                    _id: currentAppointment._id
                } : null,
                queue: waitingAppointments.map(app => ({
                    tokenNumber: app.tokenNumber,
                    patientName: app.patientName || "Unknown",
                    _id: app._id
                })),
                queueCount: waitingAppointments.length
            };
        }));

        const hospital = await Hospital.findById(hospitalId);

        res.json({
            success: true,
            data: {
                queues,
                hospitalId,
                hospitalName: hospital ? hospital.name : "Hospital Queue"
            }
        });

    } catch (error) {
        logger.error('Get all queues status error:', error);
        throw error;
    }
};

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!appointment) {
            throw new ApiError('Appointment not found', 404);
        }

        res.json({
            success: true,
            data: appointment,
            message: 'Appointment status updated'
        });
    } catch (error) {
        logger.error('Update status error:', error);
        throw error;
    }
};

export const updateAppointmentDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Ensure type is lowercase if provided
        if (updateData.type) {
            updateData.type = updateData.type.toLowerCase();
        }

        const appointment = await Appointment.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!appointment) {
            throw new ApiError('Appointment not found', 404);
        }

        res.json({
            success: true,
            data: appointment,
            message: 'Appointment updated successfully'
        });
    } catch (error) {
        logger.error('Update appointment details error:', error);
        throw error;
    }
};

export const appointmentController = {
    bookAppointment,
    getQueueStatus,
    getAllQueuesStatus,
    updateStatus,
    updateAppointmentDetails
};
