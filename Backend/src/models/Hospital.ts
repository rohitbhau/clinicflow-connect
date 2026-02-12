import mongoose, { Schema, Document } from 'mongoose';

export interface IHospital extends Document {
    name: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    phone: string;
    email: string;
    website?: string;
    licenseNumber: string;
    isActive: boolean;
    slug?: string;
    createdAt: Date;
    updatedAt: Date;
}

const HospitalSchema = new Schema<IHospital>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: { type: String, default: 'India' },
        },
        phone: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        website: {
            type: String,
        },
        licenseNumber: {
            type: String,
            required: true,
            unique: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        slug: {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

HospitalSchema.index({ name: 'text' });
// HospitalSchema.index({ slug: 1 }); // Removed duplicate index
HospitalSchema.index({ city: 1, state: 1 });

export const Hospital = mongoose.model<IHospital>('Hospital', HospitalSchema);
