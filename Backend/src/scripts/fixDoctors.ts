
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User';
import { Doctor } from '../models/Doctor';
import { Hospital } from '../models/Hospital';

dotenv.config();

const fixDoctors = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const slugs = ['rk-hospital']; // Add other slugs if needed

        for (const slug of slugs) {
            const hospital = await Hospital.findOne({ slug });
            if (!hospital) {
                console.log(`Hospital with slug ${slug} not found`);
                continue;
            }

            console.log(`Processing Hospital: ${hospital.name} (${hospital._id})`);

            // Find users with this hospital name
            const users = await User.find({
                hospitalName: hospital.name,
                role: 'doctor'
            });

            console.log(`Found ${users.length} doctor users with hospital name "${hospital.name}"`);

            for (const user of users) {
                const doctor = await Doctor.findOne({ userId: user._id });
                if (doctor) {
                    if (doctor.hospitalId.toString() !== hospital._id.toString()) {
                        console.log(`Updating doctor ${doctor.firstName} ${doctor.lastName} (User: ${user.name})`);
                        console.log(`  Old HospitalId: ${doctor.hospitalId}`);
                        console.log(`  New HospitalId: ${hospital._id}`);

                        doctor.hospitalId = hospital._id;
                        await doctor.save();
                        console.log('  Updated.');
                    } else {
                        console.log(`Doctor ${doctor.firstName} is already linked correctly.`);
                    }
                } else {
                    console.log(`No Doctor profile found for user ${user.name} (${user._id})`);
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

fixDoctors();
