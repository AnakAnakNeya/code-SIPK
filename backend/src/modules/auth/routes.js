// ============================================================================
// [PBI-01] Autentikasi, Registrasi UMKM, RBAC, dan Profil Usaha (FR-01)
// PIC: Naila
// Deskripsi: Endpoint registrasi mandiri, multi-identifier login (NIB / Email),
//            pemulihan sandi, dan proteksi sesi rate-limited.
// ============================================================================

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

// [PBI-01 - AC-01-10] Maks 5 percobaan gagal per kombinasi (IP + identifier) dalam 15 menit
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

// [PBI-01 - AC-01-01 s/d AC-01-06] Registrasi UMKM mandiri & auto-login menunggu persetujuan
router.post('/register', validate(registerSchema), controller.register);

// [PBI-01 - AC-01-08 s/d AC-01-11] Login multi-identifier & proteksi akun nonaktif
router.post('/login', loginLimiter, validate(loginSchema), controller.login);

// [PBI-01 - AC-01-17] Logout pembersihan cookie token HttpOnly
router.post('/logout', authenticate, controller.logout);

// [PBI-01 - AC-01-12] Informasi akun aktif & profil usaha terikat
router.get('/me', authenticate, controller.me);

// [PBI-01 - AC-01-14] Lupa kata sandi via email dengan token sekali pakai
router.post('/forgot-password', validate(forgotSchema), controller.forgotPassword);
router.post('/reset-password', validate(resetSchema), controller.resetPassword);

// [PBI-01 - AC-01-15] Penggantian sandi (wajib login atau mustChangePassword = true)
router.post('/change-password', authenticate, validate(changePasswordSchema), controller.changePassword);

export default router;
