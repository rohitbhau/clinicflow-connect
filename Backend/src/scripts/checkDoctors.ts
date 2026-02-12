
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Doctor } from '../models/Doctor';
import { Hospital } from '../models/Hospital';

dotenv.config();

const checkDoctors = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const slug = 'rk-hospital';
        const hospital = await Hospital.findOne({ slug });

        if (!hospital) {
            console.log(`Hospital with slug ${slug} not found`);
            return;
        }

        console.log(`Hospital: ${hospital.name} (${hospital._id})`);

        const doctors = await Doctor.find({});
        console.log(`Total Doctors in DB: ${doctors.length}`);

        doctors.forEach(doc => {
            console.log(`Doctor: ${doc.firstName} ${doc.lastName}`);
            console.log(`  _id: ${doc._id}`);
            console.log(`  hospitalId: ${doc.hospitalId}`);
            console.log(`  isActive: ${doc.isActive}`);
            console.log(`  Match? ${doc.hospitalId.toString() === hospital._id.toString()}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkDoctors();
