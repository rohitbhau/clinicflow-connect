import { Router } from 'express';
import authRoutes from './authRoutes';
import appointmentRoutes from './appointmentRoutes';
import hospitalRoutes from './hospitalRoutes';
import doctorRoutes from './doctorRoutes';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/users', authRoutes); // These might need cleanup later if they duplicate
router.use('/patients', authRoutes); // These look like placeholders
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/hospitals', hospitalRoutes);

export default router;
