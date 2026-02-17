import { Router } from 'express';
import { leaveController } from '../controllers/leaveController';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = Router();

// Public route — used by booking form to check blocked dates/slots
router.get('/blocked/:doctorId', asyncHandler(leaveController.getBlockedDates));

// Protected routes — only for doctors
router.use(authenticate);
router.use(authorize('doctor'));

router.get('/', asyncHandler(leaveController.getLeaves));
router.post('/', asyncHandler(leaveController.addLeave));
router.delete('/:id', asyncHandler(leaveController.deleteLeave));
router.patch('/:id/remove-slot', asyncHandler(leaveController.removeSlotFromLeave));

export default router;
