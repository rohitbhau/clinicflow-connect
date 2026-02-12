
import { Router } from 'express';
import { patientController } from '../controllers/patientController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = Router();

// Routes
router.get('/', authenticate, authorize('admin'), asyncHandler(patientController.getPatients));
router.get('/:id', authenticate, authorize('admin'), asyncHandler(patientController.getPatientById));

export default router;
