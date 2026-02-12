import { Router } from 'express';
import authRoutes from './authRoutes';
import appointmentRoutes from './appointmentRoutes';
import hospitalRoutes from './hospitalRoutes';
import doctorRoutes from './doctorRoutes';
import patientRoutes from './patientRoutes';
import attendanceRoutes from './attendanceRoutes';
import superAdminRoutes from './superAdminRoutes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/users', authRoutes); // These might need cleanup later if they duplicate
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/superadmin', superAdminRoutes);

export default router;
