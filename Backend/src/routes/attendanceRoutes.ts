
import { Router } from 'express';
import { attendanceController } from '../controllers/attendanceController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = Router();

// Routes for doctor attendance
router.post('/check-in', authenticate, authorize('doctor'), asyncHandler(attendanceController.checkIn));
router.post('/check-out', authenticate, authorize('doctor'), asyncHandler(attendanceController.checkOut));
router.get('/status', authenticate, authorize('doctor'), asyncHandler(attendanceController.getStatus));
router.get('/history', authenticate, authorize('doctor'), asyncHandler(attendanceController.getHistory));

export default router;
