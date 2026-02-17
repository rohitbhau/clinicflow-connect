import mongoose, { Schema, Document } from 'mongoose';

export interface IDoctorLeave extends Document {
    doctorId: mongoose.Types.ObjectId;
    date: Date;
    type: 'full-day' | 'slot';
    blockedSlots: string[]; // Array of time strings like "09:00 AM" — only used when type is 'slot'
    reason: string;
    createdAt: Date;
    updatedAt: Date;
}

const DoctorLeaveSchema = new Schema<IDoctorLeave>(
    {
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        type: {
            type: String,
            enum: ['full-day', 'slot'],
            required: true,
        },
        blockedSlots: [{
            type: String,
        }],
        reason: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for efficient lookups
DoctorLeaveSchema.index({ doctorId: 1, date: 1 });

export const DoctorLeave = mongoose.model<IDoctorLeave>('DoctorLeave', DoctorLeaveSchema);
