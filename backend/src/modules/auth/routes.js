import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './controller.js';
import {
  changePasswordSchema,
  forgotSchema,
  loginSchema,
  registerSchema,
  resetSchema,
} from './schemas.js';

// Maks 5 percobaan gagal per kombinasi (IP + identifier) dalam 15 menit; yang sukses tidak dihitung (AC-01-10).
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${String(req.body?.identifier ?? '').trim().toLowerCase()}`,
  validate: false,
  handler: (req, res) => {
    const menit = Math.max(1, Math.ceil((req.rateLimit.resetTime - Date.now()) / 60000));
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Terlalu banyak percobaan masuk. Coba lagi dalam ${menit} menit.`,
      },
    });
  },
});

const router = Router();

router.post('/register', validate(registerSchema), controller.register);
router.post('/login', loginLimiter, validate(loginSchema), controller.login);
router.post('/logout', authenticate, controller.logout);
router.get('/me', authenticate, controller.me);
router.post('/forgot-password', validate(forgotSchema), controller.forgotPassword);
router.post('/reset-password', validate(resetSchema), controller.resetPassword);
router.post('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword);

export default router;
