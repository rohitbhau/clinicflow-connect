import { Router, Request, Response } from 'express';
import { body } from 'express-validator';
import { authController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router: Router = Router();

router.post(
    '/register',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 6 }),
        body('role').isIn(['admin', 'doctor', 'staff', 'patient']),
    ],
    asyncHandler(authController.register)
);

router.post(
    '/login',
    [
        body('email').isEmail().normalizeEmail(),
        body('password').isLength({ min: 1 }),
    ],
    asyncHandler(authController.login)
);

router.get('/profile', authenticate, asyncHandler(authController.getProfile));
router.put('/profile', authenticate, asyncHandler(authController.updateProfile));
router.post('/logout', authenticate, asyncHandler(authController.logout));

export default router;
