import BusinessProfile from '../models/BusinessProfile.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/response.js';

const PENJELASAN_STATUS = {
  menunggu_persetujuan: 'Akun Anda masih menunggu persetujuan dinas. Fitur ini terbuka setelah akun disetujui.',
  ditolak: 'Pengajuan akun Anda ditolak dinas. Perbaiki data sesuai catatan lalu ajukan ulang.',
  nonaktif: 'Akun Anda dinonaktifkan. Hubungi dinas.',
};

/** Mengisi req.businessId jika ada, tanpa memblokir akun staf/kabid/mitra. */
export const maybeLoadBusiness = asyncHandler(async (req, res, next) => {
  if (req.user?.id) {
    const business = await BusinessProfile.findOne({ userId: req.user.id }).select('_id');
    if (business) req.businessId = business.id;
  }
  next();
});

/** Mengisi req.businessId (id BusinessProfile milik user yang login). Tidak mensyaratkan status aktif. */
export const loadBusiness = asyncHandler(async (req, res, next) => {
  const business = await BusinessProfile.findOne({ userId: req.user.id }).select('_id');
  if (!business) throw AppError.notFound('Profil usaha belum tersedia untuk akun ini.');
  req.businessId = business.id;
  next();
});

/** Role umkm DAN status 'aktif'; selain itu 403 code 'AKUN_BELUM_AKTIF'. Wajib setelah `authenticate`. */
export const requireActiveUmkm = asyncHandler(async (req, res, next) => {
  if (!req.user) throw AppError.unauthenticated();
  if (req.user.role !== 'umkm') throw AppError.forbidden();
  if (req.user.status !== 'aktif') {
    throw AppError.forbidden(
      PENJELASAN_STATUS[req.user.status] ?? 'Akun Anda belum aktif.',
      'AKUN_BELUM_AKTIF',
    );
  }
  return loadBusiness(req, res, next);
});
