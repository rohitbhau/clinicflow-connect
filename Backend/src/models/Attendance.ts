
import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendance extends Document {
    doctorId: mongoose.Types.ObjectId;
    date: Date;
    checkIn: Date;
    checkOut: Date | null;
    totalHours: number;
    status: 'present' | 'absent' | 'leave';
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema({
    doctorId: {
        type: Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    checkIn: {
        type: Date,
        required: true,
    },
    checkOut: {
        type: Date,
        default: null,
    },
    totalHours: {
        type: Number,
        default: 0,
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'leave'],
        default: 'present',
    },
}, {
    timestamps: true,
});

// Prevent multiple attendance records for same doctor on same day
AttendanceSchema.index({ doctorId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.model<IAttendance>('Attendance', AttendanceSchema);
