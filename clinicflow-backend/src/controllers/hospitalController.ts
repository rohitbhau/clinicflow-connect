import { Request, Response } from 'express';
import { Hospital } from '../models/Hospital';
import { Doctor } from '../models/Doctor';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { ApiError } from '../middleware/errorHandler';

export const getHospitals = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const hospitals = await Hospital.find({ isActive: true }).select('name address phone slug');

        res.json({
            success: true,
            data: hospitals,
        });
    } catch (error) {
        logger.error('Get hospitals error:', error);
        throw error;
    }
};

export const getDoctorsByHospital = async (req: Request, res: Response): Promise<void> => {
    try {
        const { hospitalId } = req.params;

        let hospital;
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(hospitalId);

        if (isObjectId) {
            hospital = await Hospital.findById(hospitalId);
        }

        if (!hospital) {
            hospital = await Hospital.findOne({ slug: hospitalId });
        }

        if (!hospital) {
            throw new ApiError('Hospital not found', 404);
        }

        const doctors = await Doctor.find({ hospitalId: hospital._id, isActive: true })
            .select('firstName lastName specialization qualification availableSlots consultationFee');

        res.json({
            success: true,
            data: {
                hospital: {
                    name: hospital.name,
                    id: hospital._id,
                    slug: hospital.slug,
                },
                doctors
            },
        });
    } catch (error) {
        logger.error('Get doctors by hospital error:', error);
        throw error;
    }
};

export const hospitalController = {
    getHospitals,
    getDoctorsByHospital,
};
