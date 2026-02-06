import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
    email: string;
    password: string;
    name: string;
    experience: string;
    profileImage: string;
    hospitalImage: string;
    role: 'admin' | 'doctor' | 'staff' | 'patient';
    hospitalName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },
        name: {
            type: String,
            trim: true,
            default: '',
        },
        experience: {
            type: String,
            default: '',
        },
        profileImage: {
            type: String,
            default: '',
        },
        hospitalImage: {
            type: String,
            default: '',
        },
        role: {
            type: String,
            enum: ['admin', 'doctor', 'staff', 'patient'],
            default: 'patient',
        },
        hospitalName: {
            type: String,
            required: function (this: IUser) {
                return this.role !== 'patient';
            },
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

UserSchema.index({ email: 1 });
UserSchema.index({ hospitalName: 1, role: 1 });

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

UserSchema.methods.comparePassword = async function (
    candidatePassword: string
): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
