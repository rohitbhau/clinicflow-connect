
import { Router } from 'express';
import { superAdminController } from '../controllers/superAdminController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = Router();

// Stats
router.get('/stats', authenticate, authorize('superadmin'), asyncHandler(superAdminController.getStats));

// Hospitals
router.get('/hospitals', authenticate, authorize('superadmin'), asyncHandler(superAdminController.getHospitals));
router.post('/hospitals', authenticate, authorize('superadmin'), asyncHandler(superAdminController.createHospital));

export default router;
