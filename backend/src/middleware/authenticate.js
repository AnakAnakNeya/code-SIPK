import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/response.js';

// Saat mustChangePassword = true hanya endpoint ini yang boleh diakses (AC-01-15).
const ALLOWED_WHEN_MUST_CHANGE = ['/auth/change-password', '/auth/me', '/auth/logout'];

function extractToken(req) {
  if (req.cookies?.token) return req.cookies.token;
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
}

/** Mengisi req.user = { id, role, status } atau 401. Status dibaca ulang dari database tiap request. */
export const authenticate = asyncHandler(async (req, res, next) => {
  let userId = null;
  const token = extractToken(req);

  if (token) {
    try {
      userId = jwt.verify(token, env.JWT_SECRET).sub;
    } catch {
      throw AppError.unauthenticated('Sesi tidak valid atau sudah berakhir. Silakan masuk kembali.');
    }
  } else if (env.isDevelopment && req.headers['x-dev-user']) {
    // Hanya aktif saat NODE_ENV=development, supaya modul lain bisa dites sebelum login jadi.
    const devUser = await User.findOne({ email: String(req.headers['x-dev-user']).toLowerCase() });
    if (!devUser) throw AppError.unauthenticated('x-dev-user: user seed tidak ditemukan.');
    userId = devUser.id;
  }

  if (!userId) throw AppError.unauthenticated();

  const user = await User.findById(userId).select('role status mustChangePassword');
  if (!user) throw AppError.unauthenticated('Akun tidak ditemukan. Silakan masuk kembali.');
  if (user.status === 'nonaktif') {
    throw AppError.forbidden('Akun dinonaktifkan, hubungi dinas.', 'AKUN_NONAKTIF');
  }

  if (user.mustChangePassword) {
    const path = req.originalUrl.split('?')[0].replace(/^\/api\/v1/, '');
    if (!ALLOWED_WHEN_MUST_CHANGE.includes(path)) {
      throw AppError.forbidden('Anda harus mengganti kata sandi terlebih dahulu.', 'MUST_CHANGE_PASSWORD');
    }
  }

  req.user = { id: user.id, role: user.role, status: user.status };
  next();
});
