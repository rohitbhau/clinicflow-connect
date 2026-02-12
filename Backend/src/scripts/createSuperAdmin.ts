
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import path from 'path';

// Specify .env path explicitly if running from script
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createSuperAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI not found");
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'superadmin@clinic.com';
        const password = 'admin123';

        const existing = await User.findOne({ email });
        if (existing) {
            console.log('Super Admin already exists');
            existing.role = 'superadmin'; // Ensure role is updated
            await existing.save();
            console.log('Updated existing user to superadmin');
        } else {
            const user = await User.create({
                email,
                password,
                name: 'Super Admin',
                role: 'superadmin',
                hospitalName: '',
            });
            console.log('Created Super Admin user:', user.email);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

createSuperAdmin();
