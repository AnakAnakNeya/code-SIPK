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
