import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        // Generate unique filename: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9]/g, '-')
            .substring(0, 30);
        cb(null, `${baseName}-${uniqueSuffix}${ext}`);
    },
});

// File filter — only allow images
const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max
    },
});

const router: Router = Router();

// Upload single image (authenticated)
router.post(
    '/',
    authenticate,
    upload.single('image'),
    asyncHandler(async (req: Request, res: Response) => {
        if (!req.file) {
            throw new ApiError('No image file provided', 400);
        }

        // Build the URL path for the uploaded file
        const imageUrl = `/uploads/${req.file.filename}`;

        logger.info(`Image uploaded: ${req.file.filename} by user ${(req as any).user?.id}`);

        res.status(201).json({
            success: true,
            data: {
                url: imageUrl,
                filename: req.file.filename,
                originalName: req.file.originalname,
                size: req.file.size,
                mimetype: req.file.mimetype,
            },
            message: 'Image uploaded successfully',
        });
    })
);

// Delete an uploaded image (authenticated)
router.delete(
    '/:filename',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        const { filename } = req.params;

        // Sanitize filename to prevent path traversal
        const sanitizedFilename = path.basename(filename);
        const filePath = path.join(uploadsDir, sanitizedFilename);

        if (!fs.existsSync(filePath)) {
            throw new ApiError('File not found', 404);
        }

        fs.unlinkSync(filePath);
        logger.info(`Image deleted: ${sanitizedFilename} by user ${(req as any).user?.id}`);

        res.json({
            success: true,
            message: 'Image deleted successfully',
        });
    })
);

export default router;
export { uploadsDir };
