import { Router } from 'express';
import { doctorController } from '../controllers/doctorController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Protect all routes
router.use(authenticate);
router.use(authorize('doctor'));

router.get('/dashboard-stats', doctorController.getDashboardStats);

export default router;
