import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Hospital } from '../models/Hospital';
import { Doctor } from '../models/Doctor';
import { config } from '../config';

dotenv.config();

const createSlug = (name: string) => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(config.MONGODB_URI);
        console.log('Connected.');

        const users = await User.find({});
        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            if (!user.hospitalName) continue;

            console.log(`Processing user ${user.name} (${user.role}) - Hospital: ${user.hospitalName}`);

            // 1. Find or Create Hospital
            let hospital = await Hospital.findOne({ name: user.hospitalName });
            if (!hospital) {
                const slug = createSlug(user.hospitalName);
                // Check if slug exists, append random if so? For now assume unique names.

                hospital = await Hospital.create({
                    name: user.hospitalName,
                    slug: slug,
                    email: `contact@${slug}.com`, // dummy
                    phone: '1234567890', // dummy
                    address: {
                        street: 'Main Street',
                        city: 'City',
                        state: 'State',
                        zipCode: '10000',
                        country: 'India'
                    },
                    licenseNumber: `LIC-${slug.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
                    isActive: true
                });
                console.log(`Created Hospital: ${hospital.name}`);
            } else {
                // Ensure slug exists
                if (!hospital.slug) {
                    hospital.slug = createSlug(hospital.name);
                    await hospital.save();
                    console.log(`Updated Hospital slug: ${hospital.name}`);
                }
            }

            // 2. If User is Doctor, ensure Doctor profile exists
            if (user.role === 'doctor') {
                let doctor = await Doctor.findOne({ userId: user._id });
                if (!doctor) {
                    const splitName = user.name ? user.name.split(' ') : ['Doctor', 'User'];
                    const firstName = splitName[0];
                    const lastName = splitName.slice(1).join(' ') || 'Smith';

                    doctor = await Doctor.create({
                        userId: user._id,
                        firstName: firstName,
                        lastName: lastName,
                        specialization: 'General Physician',
                        qualification: 'MBBS',
                        phone: '9876543210',
                        licenseNumber: `DOC-${Math.floor(Math.random() * 100000)}`,
                        hospitalId: hospital._id,
                        departmentId: new mongoose.Types.ObjectId(), // Dummy ID, department model not fully used yet
                        consultationFee: 500,
                        availableSlots: [],
                        isActive: true
                    });
                    console.log(`Created Doctor profile for: ${user.name}`);
                }
            }
        }

        console.log('Seeding completed.');
        process.exit(0);

    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
};

seedData();
