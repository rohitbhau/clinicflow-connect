import { Router } from 'express';
import { doctorController } from '../controllers/doctorController';
import { authenticate, authorize } from '../middleware/auth';

const router: Router = Router();

// Protect all routes
router.use(authenticate);
router.use(authorize('doctor'));

router.get('/dashboard-stats', doctorController.getDashboardStats);
router.get('/upcoming-appointments', doctorController.getUpcomingAppointments);
router.get('/patients', doctorController.getPatients);
router.get('/profile', doctorController.getProfile);
router.patch('/profile', doctorController.updateProfile);

export default router;
