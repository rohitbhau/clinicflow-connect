import mongoose, { Schema, Document } from 'mongoose';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';

export interface IAppointment extends Document {
    patientId?: mongoose.Types.ObjectId;
    patientName?: string;
    patientEmail?: string;
    patientPhone?: string;
    doctorId: mongoose.Types.ObjectId;
    hospitalId: mongoose.Types.ObjectId;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
    type: 'consultation' | 'follow-up' | 'emergency' | 'checkup';
    reason: string;
    notes: string;
    fee: number;
    paymentStatus: 'pending' | 'paid' | 'refunded';
    tokenNumber: string;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentSchema = new Schema<IAppointment>(
    {
        patientId: {
            type: Schema.Types.ObjectId,
            ref: 'Patient',
            required: false,
        },
        patientName: {
            type: String,
            required: false, // Required if patientId is missing, handled in validation
        },
        patientEmail: {
            type: String,
            required: false,
        },
        patientPhone: {
            type: String,
            required: false,
        },
        doctorId: {
            type: Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        hospitalId: {
            type: Schema.Types.ObjectId,
            ref: 'Hospital',
            required: true,
        },
        appointmentDate: {
            type: Date,
            required: true,
        },
        startTime: {
            type: String,
            required: true,
        },
        endTime: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
            default: 'scheduled',
        },
        type: {
            type: String,
            enum: ['consultation', 'follow-up', 'emergency', 'checkup'],
            default: 'consultation',
        },
        reason: {
            type: String,
            required: true,
        },
        notes: {
            type: String,
            default: '',
        },
        fee: {
            type: Number,
            default: 0,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending',
        },
        tokenNumber: {
            type: String,
            required: false, // Will be auto-generated
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: false,
        },
    },
    {
        timestamps: true,
    }
);

AppointmentSchema.plugin(aggregatePaginate);

AppointmentSchema.index({ hospitalId: 1, appointmentDate: 1 });
AppointmentSchema.index({ patientId: 1 });
AppointmentSchema.index({ doctorId: 1, appointmentDate: 1 });
AppointmentSchema.index({ status: 1 });

export const Appointment = mongoose.model<IAppointment>('Appointment', AppointmentSchema);
