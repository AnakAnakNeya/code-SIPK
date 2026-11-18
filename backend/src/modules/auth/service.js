import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import User from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import auditLog from '../../utils/auditLog.js';
import { sendMail } from '../../utils/mailer.js';

const BCRYPT_COST = 10;
const RESET_TTL_MS = 30 * 60 * 1000;
const DUMMY_HASH = bcrypt.hashSync('dummy-password-untuk-timing', BCRYPT_COST);
const GENERIC_LOGIN_ERROR = 'Email/NIB atau kata sandi salah';

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_COST);

export function signToken(user, remember = false) {
  const expiresIn = remember ? '7d' : '8h';
  const token = jwt.sign({ sub: String(user._id), role: user.role }, env.JWT_SECRET, { expiresIn });
  const maxAge = (remember ? 7 * 24 : 8) * 60 * 60 * 1000;
  return { token, maxAge };
}

export const cookieOptions = (maxAge) => ({
  httpOnly: true,
  sameSite: 'lax',
  secure: env.isProduction,
  ...(maxAge ? { maxAge } : {}),
});

export async function register(payload, ip) {
  const [emailTaken, nibTaken] = await Promise.all([
    User.exists({ email: payload.email }),
    BusinessProfile.exists({ nib: payload.nib }),
  ]);
  if (emailTaken || nibTaken) {
    const fields = {};
    if (emailTaken) fields.email = 'Email sudah terdaftar';
    if (nibTaken) fields.nib = 'NIB sudah terdaftar';
    throw AppError.conflict('Data yang Anda isi sudah terdaftar.', fields);
  }

  const user = await User.create({
    nama: payload.nama,
    email: payload.email,
    noHp: payload.noHp,
    passwordHash: await hashPassword(payload.password),
    role: 'umkm',
    status: 'menunggu_persetujuan',
    createdVia: 'mandiri',
  });

  let business;
  try {
    business = await BusinessProfile.create({
      userId: user._id,
      namaUsaha: payload.namaUsaha,
      kecamatan: payload.kecamatan,
      alamat: payload.alamat,
      tahunMulai: payload.tahunMulai,
      waUsaha: payload.waUsaha,
      nib: payload.nib,
      kategoriUtama: payload.kategoriUtama,
      subKomoditas: payload.subKomoditas,
      pernyataanBenarAt: new Date(),
    });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // kompensasi: tidak ada akun setengah jadi
    throw err;
  }

  await auditLog.write({ actorId: user._id, action: 'akun.registrasi', entity: 'User', entityId: user._id, ip });
  return { user, business };
}

export async function login({ identifier, password, remember }, ip) {
  const id = identifier.trim();
  const isNib = /^\d{13}$/.test(id);

  let user = null;
  if (isNib) {
    const profile = await BusinessProfile.findOne({ nib: id }).select('userId');
    if (profile) user = await User.findById(profile.userId).select('+passwordHash');
  } else {
    user = await User.findOne({ email: id.toLowerCase() }).select('+passwordHash');
  }

  // Selalu jalankan bcrypt agar waktu respons tidak membocorkan keberadaan akun.
  const passwordOk = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    await auditLog.write({ actorId: user?._id, action: 'auth.login_gagal', entity: 'User', entityId: user?._id, meta: { identifier: id }, ip });
    throw AppError.unauthenticated(GENERIC_LOGIN_ERROR);
  }
  if (user.status === 'nonaktif') {
    throw AppError.forbidden('Akun dinonaktifkan, hubungi dinas.', 'AKUN_NONAKTIF');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const business = user.role === 'umkm' ? await BusinessProfile.findOne({ userId: user._id }) : null;
  return { user, business, ...signToken(user, remember) };
}

export async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) throw AppError.unauthenticated();
  const business = user.role === 'umkm' ? await BusinessProfile.findOne({ userId }) : null;
  return { user, business };
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/** Selalu sukses (tidak membocorkan apakah email terdaftar). */
export async function forgotPassword(email, ip) {
  const user = await User.findOne({ email });
  if (!user || user.status === 'nonaktif') return;

  const token = crypto.randomBytes(32).toString('hex');
  user.resetTokenHash = sha256(token);
  user.resetExpires = new Date(Date.now() + RESET_TTL_MS);
  await user.save();

  const link = `${env.CLIENT_URL}/reset-sandi?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Atur ulang kata sandi SIPK-Lebak',
    text: `Halo ${user.nama},\n\nGunakan tautan berikut untuk mengatur ulang kata sandi (berlaku 30 menit, sekali pakai):\n${link}\n\nJika Anda tidak meminta ini, abaikan email ini.`,
  });
  await auditLog.write({ actorId: user._id, action: 'auth.reset_diminta', entity: 'User', entityId: user._id, ip });
}

export async function resetPassword({ token, password }, ip) {
  const user = await User.findOne({
    resetTokenHash: sha256(token),
    resetExpires: { $gt: new Date() },
  }).select('+resetTokenHash +resetExpires');
  if (!user) throw AppError.validation('Tautan reset tidak valid atau sudah kedaluwarsa.', { token: 'Token tidak valid atau kedaluwarsa' });

  user.passwordHash = await hashPassword(password);
  user.resetTokenHash = undefined; // sekali pakai
  user.resetExpires = undefined;
  user.mustChangePassword = false;
  await user.save();
  await auditLog.write({ actorId: user._id, action: 'auth.reset_berhasil', entity: 'User', entityId: user._id, ip });
}

export async function changePassword(userId, { currentPassword, newPassword }, ip) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw AppError.validation('Kata sandi saat ini salah.', { currentPassword: 'Kata sandi saat ini salah' });
  }
  if (currentPassword === newPassword) {
    throw AppError.validation('Kata sandi baru harus berbeda.', { newPassword: 'Kata sandi baru harus berbeda dari yang lama' });
  }
  user.passwordHash = await hashPassword(newPassword);
  user.mustChangePassword = false;
  await user.save();
  await auditLog.write({ actorId: user._id, action: 'auth.ganti_sandi', entity: 'User', entityId: user._id, ip });
}
