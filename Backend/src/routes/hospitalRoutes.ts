import express from 'express';
import { hospitalController } from '../controllers/hospitalController';
import { authenticate as protect, authorize } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/:slug/doctors', hospitalController.getHospitalBySlug);

// Protected routes
router.get('/users', protect, authorize('admin'), hospitalController.getHospitalUsers);
router.post('/users', protect, authorize('admin'), hospitalController.addHospitalUser);
router.get('/stats', protect, authorize('admin'), hospitalController.getHospitalStats);
router.delete('/users/:id', protect, authorize('admin'), hospitalController.deleteHospitalUser);
router.patch('/users/:id/status', protect, authorize('admin'), hospitalController.updatedUserStatus);
router.put('/details', protect, authorize('admin'), hospitalController.updateHospitalDetails);

export default router;
