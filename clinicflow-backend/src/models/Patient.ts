import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
    userId: mongoose.Types.ObjectId;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: 'male' | 'female' | 'other';
    phone: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    medicalHistory: string[];
    allergies: string[];
    insuranceInfo: {
        provider: string;
        policyNumber: string;
        groupNumber: string;
    };
    hospitalId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PatientSchema = new Schema<IPatient>(
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
        dateOfBirth: {
            type: Date,
            required: true,
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other'],
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: { type: String, default: 'India' },
        },
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String,
        },
        medicalHistory: [{
            type: String,
        }],
        allergies: [{
            type: String,
        }],
        insuranceInfo: {
            provider: String,
            policyNumber: String,
            groupNumber: String,
        },
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

PatientSchema.index({ hospitalId: 1 });
PatientSchema.index({ userId: 1 });
PatientSchema.index({ firstName: 1, lastName: 1 });
PatientSchema.index({ phone: 1 });

export const Patient = mongoose.model<IPatient>('Patient', PatientSchema);
