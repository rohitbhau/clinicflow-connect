import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController';
import { asyncHandler } from '../middleware/errorHandler';
// Note: We might need auth for status update, assuming handled or public for demo?
// Actually, status update should be protected.
import { authenticate } from '../middleware/auth';

const router: Router = Router();

// Public route for booking
router.post('/book', asyncHandler(appointmentController.bookAppointment));
router.get('/queue/:doctorId', asyncHandler(appointmentController.getQueueStatus));
router.get('/queue/hospital/:hospitalId', asyncHandler(appointmentController.getAllQueuesStatus));

// Protected routes
router.patch('/:id/status', authenticate, asyncHandler(appointmentController.updateStatus));
router.put('/:id', authenticate, asyncHandler(appointmentController.updateAppointmentDetails));

export default router;
