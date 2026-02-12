
import { Request, Response } from 'express';
import { Patient } from '../models/Patient';
import { Hospital } from '../models/Hospital';
import { User } from '../models/User';
import { ApiError } from '../middleware/errorHandler';

export const getPatients = async (req: Request, res: Response) => {
    try {
        let query = {};

        // If hospital admin, filter by hospital
        if (req.user.role === 'admin' && req.user.hospitalName) {
            const hospital = await Hospital.findOne({ name: req.user.hospitalName });
            if (hospital) {
                query = { hospitalId: hospital._id };
            } else {
                // If hospital not found (edge case), return empty
                return res.json({ success: true, data: [] });
            }
        }

        const patients = await Patient.find(query)
            .populate('hospitalId', 'name')
            .populate('userId', 'email')
            .sort({ createdAt: -1 });

        const data = patients.map(p => {
            const user = p.userId as any;
            const hospital = p.hospitalId as any;
            const dob = new Date(p.dateOfBirth);
            const age = new Date().getFullYear() - dob.getFullYear();

            return {
                id: p._id,
                name: `${p.firstName} ${p.lastName}`,
                email: user?.email || "N/A",
                phone: p.phone,
                status: "active",
                hospitalId: hospital?._id || "",
                hospitalName: hospital?.name || "Unknown",
                doctorName: "N/A",
                lastVisit: p.updatedAt.toISOString().split('T')[0],
                gender: p.gender,
                age: age,
                totalVisits: 0 // Placeholder
            };
        });

        res.json({ success: true, data });
    } catch (error) {
        throw error;
    }
};

export const getPatientById = async (req: Request, res: Response) => {
    try {
        const patient = await Patient.findById(req.params.id)
            .populate('hospitalId', 'name')
            .populate('userId', 'email');

        if (!patient) {
            throw new ApiError('Patient not found', 404);
        }

        res.json({ success: true, data: patient });
    } catch (error) {
        throw error;
    }
};

export const patientController = {
    getPatients,
    getPatientById
};
