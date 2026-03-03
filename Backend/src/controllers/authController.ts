import { Response, Request } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import axios from 'axios';
import { User } from '../models/User';
import { Hospital } from '../models/Hospital';
import { Doctor } from '../models/Doctor';
import { AuthRequest } from '../middleware/auth';
import { ApiError } from '../middleware/errorHandler';
import { config } from '../config/index';
import { cache } from '../utils/cache';
import { logger } from '../utils/logger';

// ─── Helper: Send email via Brevo API ────────────────────────────────────────
const sendBrevoEmail = async (to: string, toName: string, subject: string, htmlContent: string) => {
    try {
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: { name: 'ClinicFlow', email: process.env.EMAIL_USER || 'a30453001@smtp-brevo.com' },
                to: [{ email: to, name: toName }],
                subject,
                htmlContent,
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );
        logger.info(`Email sent to ${to}`);
    } catch (err) {
        logger.error(`Failed to send email to ${to}:`, err);
        // Don't throw — email failure shouldn't break registration
    }
};

// ─── Welcome Email Template ───────────────────────────────────────────────────
const welcomeEmailHtml = (name: string, role: string, appUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:16px 16px 0 0;padding:40px 40px 32px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:16px;padding:12px 20px;margin-bottom:16px;">
            <span style="color:white;font-size:28px;">🏥</span>
          </div>
          <h1 style="margin:0;color:white;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Welcome to ClinicFlow!</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:15px;">Your clinic management journey starts here</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:white;padding:40px;">
          <h2 style="margin:0 0 8px;color:#1f2937;font-size:22px;">Hey ${name}! 👋</h2>
          <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">We're thrilled to have you on board. Your <strong style="color:#6366f1;">${role}</strong> account has been created successfully.</p>
          
          <!-- Features -->
          <div style="background:#f9fafb;border-radius:12px;padding:24px;margin:0 0 28px;">
            <p style="margin:0 0 16px;color:#374151;font-weight:600;font-size:14px;text-transform:uppercase;letter-spacing:0.5px;">✨ What you can do</p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:8px 0;">
                  <span style="display:inline-block;background:#ede9fe;color:#6366f1;border-radius:6px;padding:4px 8px;font-size:13px;margin-right:10px;">📅</span>
                  <span style="color:#374151;font-size:14px;">Manage appointments effortlessly</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <span style="display:inline-block;background:#ede9fe;color:#6366f1;border-radius:6px;padding:4px 8px;font-size:13px;margin-right:10px;">👨‍⚕️</span>
                  <span style="color:#374151;font-size:14px;">Track doctors & staff in real-time</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <span style="display:inline-block;background:#ede9fe;color:#6366f1;border-radius:6px;padding:4px 8px;font-size:13px;margin-right:10px;">📊</span>
                  <span style="color:#374151;font-size:14px;">Access powerful analytics & reports</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <span style="display:inline-block;background:#ede9fe;color:#6366f1;border-radius:6px;padding:4px 8px;font-size:13px;margin-right:10px;">🔒</span>
                  <span style="color:#374151;font-size:14px;">Secure & role-based access control</span>
                </td>
              </tr>
            </table>
          </div>

          <!-- CTA Button -->
          <div style="text-align:center;margin:0 0 28px;">
            <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:700;font-size:16px;letter-spacing:0.3px;">🚀 Go to Dashboard</a>
          </div>

          <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6;">If you have any questions, just reply to this email — we're always happy to help!</p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f9fafb;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
          <p style="margin:0 0 4px;color:#6366f1;font-weight:700;font-size:14px;">ClinicFlow</p>
          <p style="margin:0;color:#9ca3af;font-size:12px;">Simplifying clinic management, one appointment at a time.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>
`;

const createSlug = (name: string) => {
    return name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

const generateToken = (id: string, role: string, hospitalName?: string): string => {
    const payload = { id, role, hospitalName };
    const options: SignOptions = {
        expiresIn: config.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    };
    return jwt.sign(payload, config.JWT_SECRET, options);
};

interface RegisterRequest extends AuthRequest {
    body: {
        name: string;
        email: string;
        password: string;
        role: string;
        hospitalName?: string;
        hospitalPhone?: string;
        doctors?: any[];
        staff?: any[];
    };
}

interface LoginRequest extends AuthRequest {
    body: {
        email: string;
        password: string;
    };
}

export const register = async (req: RegisterRequest, res: Response): Promise<void> => {
    try {
        const { name, email, password, role, hospitalName, doctors, staff, hospitalPhone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new ApiError('Email already registered', 400);
        }

        // --- HOSPITAL REGISTRATION FLOW ---
        if (role === 'admin' && hospitalName) {
            // 1. Create Admin User
            const user = await User.create({
                name: name || 'Hospital Admin',
                email,
                password,
                role: 'admin',
                hospitalName,
            });

            // 2. Create Hospital Entity
            const slug = createSlug(hospitalName);
            const existingSlug = await Hospital.findOne({ slug });
            const finalSlug = existingSlug ? `${slug}-${Math.floor(Math.random() * 1000)}` : slug;

            const hospital = await Hospital.create({
                name: hospitalName,
                slug: finalSlug,
                email: email,
                phone: hospitalPhone || '0000000000',
                address: { street: '', city: '', state: '', zipCode: '', country: 'India' },
                licenseNumber: `PENDING-${finalSlug.toUpperCase()}-${Math.floor(Math.random() * 10000)}`,
                isActive: true
            });

            const generatedCredentials: any[] = [];

            // 3. Process Doctors
            if (doctors && Array.isArray(doctors)) {
                for (const doc of doctors) {
                    const docPassword = Math.random().toString(36).slice(-8); // Generate 8 char password
                    const docUser = await User.create({
                        name: doc.name,
                        email: doc.email,
                        password: docPassword,
                        role: 'doctor',
                        hospitalName,
                        isActive: true
                    });

                    const splitName = doc.name ? doc.name.split(' ') : ['Doctor', 'User'];
                    await Doctor.create({
                        userId: docUser._id,
                        hospitalId: hospital._id,
                        firstName: splitName[0],
                        lastName: splitName.slice(1).join(' ') || 'Doc',
                        specialization: doc.specialization || 'General',
                        qualification: doc.qualification || 'MBBS',
                        phone: doc.phone || '0000000000',
                        licenseNumber: `DOC-${docUser._id.toString().substring(0, 6).toUpperCase()}-${Math.floor(Math.random() * 1000)}`,
                        departmentId: new mongoose.Types.ObjectId(), // Dummy
                        isActive: true
                    });

                    generatedCredentials.push({
                        name: doc.name,
                        email: doc.email,
                        password: docPassword,
                        role: 'doctor'
                    });
                }
            }

            // 4. Process Staff
            if (staff && Array.isArray(staff)) {
                for (const member of staff) {
                    const staffPassword = Math.random().toString(36).slice(-8);
                    await User.create({
                        name: member.name,
                        email: member.email,
                        password: staffPassword,
                        role: 'staff',
                        hospitalName,
                        isActive: true
                    });

                    generatedCredentials.push({
                        name: member.name,
                        email: member.email,
                        password: staffPassword,
                        role: 'staff'
                    });
                }
            }

            const token = generateToken(user._id.toString(), user.role, user.hospitalName);

            // Send welcome email to admin
            const appUrl = process.env.FRONTEND_URL || 'https://clinicflow-connect.vercel.app';
            await sendBrevoEmail(
                user.email,
                user.name || 'Admin',
                '🎉 Welcome to ClinicFlow — Your Clinic is Ready!',
                welcomeEmailHtml(user.name || 'Admin', 'Hospital Admin', appUrl)
            );

            res.status(201).json({
                success: true,
                data: {
                    user: {
                        id: user._id,
                        email: user.email,
                        role: user.role,
                        name: user.name,
                        hospitalName: user.hospitalName,
                    },
                    token,
                    generatedCredentials // Return these so frontend can show them
                },
            });
            return;
        }

        // --- STANDARD REGISTRATION (Fallback) ---
        const user = await User.create({
            name,
            email,
            password,
            role,
            hospitalName,
        });

        const token = generateToken(user._id.toString(), user.role, user.hospitalName);

        // Send welcome email
        const appUrl = process.env.FRONTEND_URL || 'https://clinicflow-connect.vercel.app';
        await sendBrevoEmail(
            user.email,
            user.name || 'User',
            '🎉 Welcome to ClinicFlow!',
            welcomeEmailHtml(user.name || 'User', role, appUrl)
        );

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    profileImage: user.profileImage,
                    hospitalName: user.hospitalName,
                    hospitalImage: user.hospitalImage,
                },
                token,
            },
        });
    } catch (error) {
        // cleanup on failure
        const { role, hospitalName, email } = req.body;
        if (role === 'admin' && hospitalName) {
            const userCleanup = await User.findOne({ email });
            if (userCleanup) {
                await User.deleteOne({ _id: userCleanup._id });
                logger.info(`Cleaned up user ${email} after failed registration`);
            }
            const hospitalCleanup = await Hospital.findOne({ name: hospitalName });
            if (hospitalCleanup) {
                await Hospital.deleteOne({ _id: hospitalCleanup._id });
                logger.info(`Cleaned up hospital ${hospitalName} after failed registration`);
            }
            // Note: Doctors/Staff created in loop might remain if we don't track them,
            // but usually the first failure stops the loop.
            // For robustness we could track created IDs.
        }

        logger.error('Registration error:', error);
        throw error;
    }
};

export const login = async (req: LoginRequest, res: Response): Promise<void> => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            throw new ApiError('Invalid credentials', 401);
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            throw new ApiError('Invalid credentials', 401);
        }

        if (!user.isActive) {
            throw new ApiError('Account is deactivated', 401);
        }

        const token = generateToken(user._id.toString(), user.role, user.hospitalName);

        // Update last active time (using updatedAt for now)
        await User.findByIdAndUpdate(user._id, { updatedAt: new Date() });

        cache.del(`user:${user._id}`);

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    profileImage: user.profileImage,
                    hospitalName: user.hospitalName,
                    hospitalImage: user.hospitalImage,
                },
                token,
            },
        });
    } catch (error) {
        logger.error('Login error:', error);
        throw error;
    }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const cacheKey = `user:${req.user?.id}`;
        const cachedUser = cache.get(cacheKey);

        if (cachedUser) {
            res.json({
                success: true,
                data: cachedUser,
            });
            return;
        }

        const user = await User.findById(req.user?.id);
        if (!user) {
            throw new ApiError('User not found', 404);
        }

        cache.set(cacheKey, user);

        res.json({
            success: true,
            data: user,
        });
    } catch (error) {
        logger.error('Get profile error:', error);
        throw error;
    }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        cache.del(`user:${req.user?.id}`);

        res.json({
            success: true,
            message: 'Logged out successfully',
        });
    } catch (error) {
        logger.error('Logout error:', error);
        throw error;
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { name, experience, profileImage, hospitalImage } = req.body;
        const userId = req.user?.id;

        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError('User not found', 404);
        }

        if (name !== undefined) user.name = name;
        if (experience !== undefined) user.experience = experience;
        if (profileImage !== undefined) user.profileImage = profileImage;
        if (hospitalImage !== undefined) user.hospitalImage = hospitalImage;

        await user.save();

        // Invalidate cache
        cache.del(`user:${userId}`);

        res.json({
            success: true,
            data: user,
            message: 'Profile updated successfully',
        });
    } catch (error) {
        logger.error('Update profile error:', error);
        throw error;
    }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        // Always return success to avoid email enumeration
        if (!user) {
            res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
            return;
        }

        // Generate token
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Save to user (we store on User model as plain fields)
        (user as any).resetPasswordToken = hashedToken;
        (user as any).resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 min
        await user.save({ validateBeforeSave: false });

        // Build reset URL — points to frontend reset page
        const frontendUrl = process.env.FRONTEND_URL || 'https://clinicflow-connect.vercel.app';
        const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

        // Send email via Brevo API
        await axios.post(
            'https://api.brevo.com/v3/smtp/email',
            {
                sender: { name: 'ClinicFlow', email: process.env.EMAIL_USER || 'a30453001@smtp-brevo.com' },
                to: [{ email: user.email, name: user.name || 'User' }],
                subject: 'Password Reset Request - ClinicFlow',
                htmlContent: `
                    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
                        <div style="text-align:center;margin-bottom:24px;">
                            <h2 style="color:#6366f1;margin:0;">ClinicFlow</h2>
                        </div>
                        <h3 style="color:#1f2937;">Reset Your Password</h3>
                        <p style="color:#4b5563;">You requested a password reset. Click the button below to set a new password.</p>
                        <div style="text-align:center;margin:32px 0;">
                            <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:white;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:16px;">Reset Password</a>
                        </div>
                        <p style="color:#6b7280;font-size:14px;">This link expires in <strong>30 minutes</strong>.</p>
                        <p style="color:#6b7280;font-size:14px;">If you didn't request this, please ignore this email. Your account is safe.</p>
                        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                        <p style="color:#9ca3af;font-size:12px;text-align:center;">ClinicFlow - Clinic Management System</p>
                    </div>
                `,
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        logger.error('Forgot password error:', error);
        throw error;
    }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        }).select('+password');

        if (!user) {
            throw new ApiError('Invalid or expired reset token', 400);
        }

        user.password = password;
        (user as any).resetPasswordToken = undefined;
        (user as any).resetPasswordExpires = undefined;
        await user.save();

        res.json({ success: true, message: 'Password reset successfully. Please login.' });
    } catch (error) {
        logger.error('Reset password error:', error);
        throw error;
    }
};

export const authController = {
    register,
    login,
    getProfile,
    updateProfile,
    logout,
    forgotPassword,
    resetPassword,
};
