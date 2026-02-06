import { Router } from 'express';
import { hospitalController } from '../controllers/hospitalController';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = Router();

// Public routes
router.get('/', hospitalController.getHospitals);
router.get('/:hospitalId/doctors', hospitalController.getDoctorsByHospital);

export default router;
