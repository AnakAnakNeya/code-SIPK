import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import BusinessProfile from '../../models/BusinessProfile.js';
import User from '../../models/User.js';
import LegalDocument from '../../models/LegalDocument.js';
import Product from '../../models/Product.js';
import { AppError } from '../../utils/AppError.js';
import auditLog from '../../utils/auditLog.js';
import { KECAMATAN } from '../../constants/kecamatan.js';

export async function getProfile(businessId) {
  const profile = await BusinessProfile.findById(businessId);
  if (!profile) throw AppError.notFound('Profil usaha tidak ditemukan.');
  return profile;
}

/** Ubah profil usaha. NIB tidak termasuk (hanya dinas yang boleh, AC-01-16). */
export async function updateProfile(businessId, userId, changes, ip) {
  const profile = await getProfile(businessId);
  Object.assign(profile, changes);
  await profile.save();
  await auditLog.write({
    actorId: userId,
    action: 'profil.diubah',
    entity: 'BusinessProfile',
    entityId: profile._id,
    meta: { fields: Object.keys(changes) },
    ip,
  });
  return profile;
}

/** Direktori UMKM untuk staf & kabid (PBI-06) */
export async function listDirectory({ kecamatan, kategori, statusAkun, q, page = 1, limit = 10 }) {
  const match = {};
  if (kecamatan && kecamatan !== 'all') match.kecamatan = kecamatan;
  if (kategori && kategori !== 'all') match.kategoriUtama = kategori;

  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match.$or = [{ namaUsaha: rx }, { nib: rx }, { alamat: rx }];
  }

  const skip = (Math.max(1, page) - 1) * limit;

  const [profiles, total] = await Promise.all([
    BusinessProfile.find(match)
      .populate('userId', 'nama email noHp status catatanStatus createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    BusinessProfile.countDocuments(match),
  ]);

  // Filter status akun jika diminta
  let filtered = profiles;
  if (statusAkun && statusAkun !== 'all') {
    filtered = profiles.filter((p) => p.userId?.status === statusAkun);
  }

  // Hitung jumlah produk & dokumen per profil
  const items = await Promise.all(
    filtered.map(async (p) => {
      const [totalProduk, terkurasiProduk, docs] = await Promise.all([
        Product.countDocuments({ businessId: p._id }),
        Product.countDocuments({ businessId: p._id, statusKurasi: 'terkurasi' }),
        LegalDocument.find({ businessId: p._id }).select('jenis statusVerifikasi'),
      ]);
      return {
        id: String(p._id),
        namaUsaha: p.namaUsaha,
        kecamatan: p.kecamatan,
        kategoriUtama: p.kategoriUtama,
        subKomoditas: p.subKomoditas,
        nib: p.nib,
        waUsaha: p.waUsaha,
        alamat: p.alamat,
        tahunMulai: p.tahunMulai,
        user: p.userId
          ? {
              id: String(p.userId._id),
              nama: p.userId.nama,
              email: p.userId.email,
              noHp: p.userId.noHp,
              status: p.userId.status,
              catatanStatus: p.userId.catatanStatus,
              createdAt: p.userId.createdAt,
            }
          : null,
        dokumen: docs,
        totalProduk,
        terkurasiProduk,
      };
    }),
  );

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/** Ringkasan jumlah UMKM per 28 kecamatan (AC-06-03) */
export async function getSummaryPerKecamatan() {
  const counts = await BusinessProfile.aggregate([
    { $group: { _id: '$kecamatan', count: { $sum: 1 } } },
  ]);

  const map = Object.fromEntries(counts.map((c) => [c._id, c.count]));
  return KECAMATAN.map((k) => ({
    kecamatan: k,
    total: map[k] || 0,
  }));
}

/** Persetujuan akun dinas (AC-06-06, AC-06-07) */
export async function verifyAccount(businessId, stafId, { keputusan, catatan }, ip) {
  const profile = await BusinessProfile.findById(businessId);
  if (!profile) throw AppError.notFound('Profil usaha tidak ditemukan');

  const user = await User.findById(profile.userId);
  if (!user) throw AppError.notFound('Akun pengguna tidak ditemukan');

  if (keputusan === 'setuju') {
    // Cek keberadaan dokumen NIB (AC-06-06)
    const nibDoc = await LegalDocument.findOne({ businessId, jenis: 'nib' });
    if (!nibDoc) {
      throw AppError.conflict(
        'Akun tidak dapat disetujui sebelum pelaku UMKM mengunggah salinan berkas NIB.',
      );
    }

    user.status = 'aktif';
    user.catatanStatus = null;
    nibDoc.statusVerifikasi = 'valid';
    nibDoc.verifiedBy = stafId;
    nibDoc.verifiedAt = new Date();
    await nibDoc.save();
  } else {
    user.status = 'ditolak';
    user.catatanStatus = catatan || 'Berkas NIB tidak sesuai dengan data OSS-RBA';
  }

  await user.save();

  await auditLog.write({
    actorId: stafId,
    action: `akun.${keputusan}`,
    entity: 'User',
    entityId: user._id,
    meta: { businessId, keputusan, catatan },
    ip,
  });

  return {
    status: user.status,
    catatanStatus: user.catatanStatus,
  };
}

/**
 * Daftarkan UMKM Manual oleh Staf Dinas (AC-06-09)
 * Akun langsung aktif (createdVia: 'dinas') dengan kata sandi sementara dan mustChangePassword = true.
 */
export async function registerManualByDinas(data, stafId, ip) {
  const { nama, email, noHp, namaUsaha, kecamatan, kategoriUtama, subKomoditas, nib, alamat, waUsaha } = data;

  if (!nama || !email || !namaUsaha || !kecamatan) {
    throw AppError.validation('Nama pemilik, email, nama usaha, dan kecamatan wajib diisi');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw AppError.conflict('Email sudah terdaftar dalam sistem.');
  }

  const cleanNib = nib ? String(nib).trim() : '';
  if (cleanNib) {
    const existingNib = await BusinessProfile.findOne({ nib: cleanNib });
    if (existingNib) {
      throw AppError.conflict('Nomor Induk Berusaha (NIB) sudah terdaftar.');
    }
  }

  // Buat kata sandi sementara 10 karakter acak
  const tempPassword = 'Lbk' + crypto.randomBytes(4).toString('hex').slice(0, 6) + '!';
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = await User.create({
    nama: nama.trim(),
    email: email.toLowerCase().trim(),
    noHp: noHp ? String(noHp).trim() : '',
    passwordHash: hashedPassword,
    role: 'umkm',
    status: 'aktif',
    createdVia: 'dinas',
    mustChangePassword: true,
  });

  const profile = await BusinessProfile.create({
    userId: user._id,
    namaUsaha: namaUsaha.trim(),
    kecamatan,
    kategoriUtama: kategoriUtama || 'olahan_pangan',
    subKomoditas: subKomoditas ? subKomoditas.trim() : '',
    nib: cleanNib,
    alamat: alamat ? alamat.trim() : '',
    waUsaha: waUsaha ? String(waUsaha).trim() : (noHp ? String(noHp).trim() : ''),
    tahunMulai: new Date().getFullYear(),
  });

  await auditLog.write({
    actorId: stafId,
    action: 'umkm.didaftarkan_manual_dinas',
    entity: 'User',
    entityId: user._id,
    meta: { businessId: profile._id, namaUsaha, kecamatan },
    ip,
  });

  return {
    user: {
      id: String(user._id),
      nama: user.nama,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    business: {
      id: String(profile._id),
      namaUsaha: profile.namaUsaha,
      kecamatan: profile.kecamatan,
      kategoriUtama: profile.kategoriUtama,
      nib: profile.nib,
    },
    temporaryPassword: tempPassword,
  };
}

/**
 * UMKM Mengajukan Ulang Akun setelah Ditolak Dinas (AC-06-07)
 */
export async function reapplyAccount(businessId, userId, ip) {
  const user = await User.findById(userId);
  if (!user) throw AppError.notFound('Pengguna tidak ditemukan');

  if (user.status !== 'ditolak') {
    throw AppError.badRequest('Hanya akun yang berstatus ditolak yang dapat mengajukan ulang verifikasi.');
  }

  user.status = 'menunggu_persetujuan';
  user.catatanStatus = null;
  await user.save();

  await auditLog.write({
    actorId: userId,
    action: 'akun.ajukan_ulang',
    entity: 'User',
    entityId: user._id,
    meta: { businessId },
    ip,
  });

  return {
    status: user.status,
    message: 'Pengajuan ulang verifikasi akun berhasil dikirim ke dinas.',
  };
}
