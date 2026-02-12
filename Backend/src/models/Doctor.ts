import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctor extends Document {
    userId: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    specialization: string;
    qualification: string;
    phone: string;
    licenseNumber: string;
    hospitalId: mongoose.Types.ObjectId;
    departmentId: mongoose.Types.ObjectId;
    consultationFee: number;
    availableSlots: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isAvailable: boolean;
    }[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const DoctorSchema = new Schema<IDoctor>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        firstName: {
            type: String,
            required: true,
            trim: true,
        },
        lastName: {
            type: String,
            required: true,
            trim: true,
        },
        specialization: {
            type: String,
            required: true,
        },
        qualification: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        licenseNumber: {
            type: String,
            required: true,
            unique: true,
        },
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            required: true,
        },
        departmentId: {
            type: Schema.Types.ObjectId,
            ref: 'Department',
            required: true,
        },
        consultationFee: {
            type: Number,
            default: 0,
        },
        availableSlots: [{
            dayOfWeek: { type: Number, min: 0, max: 6 },
            startTime: String,
            endTime: String,
            isAvailable: { type: Boolean, default: true },
        }],
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

DoctorSchema.index({ hospitalId: 1 });
DoctorSchema.index({ departmentId: 1 });
DoctorSchema.index({ specialization: 1 });
// DoctorSchema.index({ licenseNumber: 1 }); // Removed duplicate index

export const Doctor = mongoose.model<IDoctor>('Doctor', DoctorSchema);
