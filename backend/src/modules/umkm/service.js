import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import ExcelJS from 'exceljs';
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

/** Aman dari karakter spesial regex (cegah ReDoS / injeksi pola). */
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Susun filter direktori. Filter status akun diterapkan di level query (bukan setelah
 * paginasi) agar total & jumlah halaman akurat (AC-06-02).
 */
async function buildDirectoryMatch({ kecamatan, kategori, statusAkun, q }) {
  const match = {};
  if (kecamatan && kecamatan !== 'all') match.kecamatan = kecamatan;
  if (kategori && kategori !== 'all') match.kategoriUtama = kategori;

  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    match.$or = [{ namaUsaha: rx }, { nib: rx }, { alamat: rx }];
  }

  if (statusAkun && statusAkun !== 'all') {
    const userIds = await User.find({ role: 'umkm', status: statusAkun }).distinct('_id');
    match.userId = { $in: userIds };
  }
  return match;
}

/** Direktori UMKM untuk staf & kabid (PBI-06) */
export async function listDirectory({ kecamatan, kategori, statusAkun, q, page = 1, limit = 10 }) {
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
  const match = await buildDirectoryMatch({ kecamatan, kategori, statusAkun, q });

  const [profiles, total] = await Promise.all([
    BusinessProfile.find(match)
      .populate('userId', 'nama email noHp status catatanStatus createdAt')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    BusinessProfile.countDocuments(match),
  ]);

  // Hindari N+1: ambil dokumen & hitungan produk semua profil halaman ini sekaligus.
  const ids = profiles.map((p) => p._id);
  const [docs, productCounts] = await Promise.all([
    LegalDocument.find({ businessId: { $in: ids } }).select('businessId jenis statusVerifikasi').lean(),
    Product.aggregate([
      { $match: { businessId: { $in: ids } } },
      {
        $group: {
          _id: '$businessId',
          total: { $sum: 1 },
          terkurasi: { $sum: { $cond: [{ $eq: ['$statusKurasi', 'terkurasi'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const docsByBiz = new Map();
  for (const d of docs) {
    const key = String(d.businessId);
    if (!docsByBiz.has(key)) docsByBiz.set(key, []);
    docsByBiz.get(key).push({ _id: d._id, jenis: d.jenis, statusVerifikasi: d.statusVerifikasi });
  }
  const countByBiz = new Map(productCounts.map((c) => [String(c._id), c]));

  const items = profiles.map((p) => {
    const counts = countByBiz.get(String(p._id));
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
      dokumen: docsByBiz.get(String(p._id)) ?? [],
      totalProduk: counts?.total ?? 0,
      terkurasiProduk: counts?.terkurasi ?? 0,
    };
  });

  return {
    items,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
}
/** Cegah formula injection di Excel: sel berawalan = + - @ dianggap teks. */
const safeCell = (v) => (typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : v);

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

  // Data sudah divalidasi & dinormalisasi oleh registerManualSchema (route).
  const [emailTaken, nibTaken] = await Promise.all([User.exists({ email }), BusinessProfile.exists({ nib })]);
  if (emailTaken || nibTaken) {
    const fields = {};
    if (emailTaken) fields.email = 'Email sudah terdaftar';
    if (nibTaken) fields.nib = 'NIB sudah terdaftar';
    throw AppError.conflict('Data yang Anda isi sudah terdaftar.', fields);
  }

  // Kata sandi sementara acak (kriptografis)
  const tempPassword = `Lbk${crypto.randomBytes(4).toString('hex').slice(0, 6)}!7`;
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const user = await User.create({
    nama,
    email,
    noHp: noHp || '',
    passwordHash: hashedPassword,
    role: 'umkm',
    status: 'aktif',
    createdVia: 'dinas',
    mustChangePassword: true,
  });

  let profile;
  try {
    profile = await BusinessProfile.create({
      userId: user._id,
      namaUsaha,
      kecamatan,
      kategoriUtama,
      subKomoditas,
      nib,
      alamat,
      waUsaha: waUsaha || noHp || '-',
      tahunMulai: new Date().getFullYear(),
    });
  } catch (err) {
    await User.deleteOne({ _id: user._id }); // kompensasi: tidak ada akun tanpa profil
    throw err;
  }
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

/**
 * Detail Lengkap UMKM untuk Staf/Kabid (AC-06-04)
 * Menampilkan data usaha, berkas legalitas, dan produk terdaftar.
 */
export async function getUmkmDetail(businessId) {
  const profile = await BusinessProfile.findById(businessId).lean();
  if (!profile) throw AppError.notFound('Profil usaha tidak ditemukan');

  const [user, documents, products] = await Promise.all([
    User.findById(profile.userId).select('nama email noHp status catatanStatus createdVia createdAt').lean(),
    LegalDocument.find({ businessId: profile._id }).lean(),
    Product.find({ businessId: profile._id }).lean(),
  ]);

  return {
    ...profile,
    id: String(profile._id),
    user: user
      ? {
          id: String(user._id),
          nama: user.nama,
          email: user.email,
          noHp: user.noHp,
          status: user.status,
          catatanStatus: user.catatanStatus,
          createdVia: user.createdVia,
          createdAt: user.createdAt,
        }
      : null,
    documents: documents.map((d) => ({
      id: String(d._id),
      jenis: d.jenis,
      nomor: d.nomor || null,
      masaBerlaku: d.masaBerlaku || null,
      masaSimpanBulan: d.masaSimpanBulan || null,
      statusVerifikasi: d.statusVerifikasi,
      catatan: d.catatan || null,
      file: d.file
        ? {
            namaAsli: d.file.namaAsli,
            mime: d.file.mime,
            ukuran: d.file.ukuran,
          }
        : null,
      verifiedAt: d.verifiedAt || null,
    })),
    products: products.map((p) => ({
      id: String(p._id),
      nama: p.nama,
      kategori: p.kategori,
      subKomoditas: p.subKomoditas,
      satuan: p.satuan,
      hargaAcuan: p.hargaAcuan,
      kapasitasBulanan: p.kapasitasBulanan,
      statusKurasi: p.statusKurasi,
      gradeKurasi: p.gradeKurasi || null,
    })),
  };
}

/**
 * Ekspor Direktori UMKM ke Format Excel .xlsx (AC-06-10)
 * Mengikuti filter aktif: kecamatan, kategori, statusAkun, dan pencarian teks.
 */
export async function exportDirectoryExcel({ kecamatan, kategori, statusAkun, q }) {
  const match = await buildDirectoryMatch({ kecamatan, kategori, statusAkun, q });

  const filtered = await BusinessProfile.find(match)
    .populate('userId', 'nama email noHp status catatanStatus createdAt')
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIPK-Lebak (Dinas Koperasi & UKM Kab. Lebak)';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Direktori UMKM Lebak', {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  // Judul Laporan Resmi Dinas
  worksheet.mergeCells('A1:L1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'PEMERINTAH KABUPATEN LEBAK - DINAS KOPERASI DAN USAHA KECIL MENENGAH';
  titleCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF0F2A4F' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:L2');
  const subTitleCell = worksheet.getCell('A2');
  subTitleCell.value = `REKAPITULASI DATA BINAAN UMKM DAERAH (Diekspor: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })})`;
  subTitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF475569' } };
  subTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.addRow([]); // Baris 3 spacer

  // Header Table
  const headers = [
    'No',
    'Nama Unit Usaha',
    'NIB (13 Digit OSS-RBA)',
    'Nama Pemilik',
    'Email',
    'No. WhatsApp Usaha',
    'Kecamatan Sentra',
    'Alamat Lengkap',
    'Kategori Komoditas',
    'Sub-Komoditas',
    'Tahun Mulai',
    'Status Akun Dinas',
  ];

  const headerRow = worksheet.addRow(headers);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F2A4F' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF0F2A4F' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
    };
  });

  // Data rows
  filtered.forEach((p, index) => {
    const row = worksheet.addRow([
      index + 1,
      safeCell(p.namaUsaha),
      p.nib,
      safeCell(p.userId?.nama) || '-',
      safeCell(p.userId?.email) || '-',
      p.waUsaha || p.userId?.noHp || '-',
      p.kecamatan,
      safeCell(p.alamat),
      p.kategoriUtama === 'olahan_pangan' ? 'Olahan Pangan' : 'Kriya & Tenun',
      Array.isArray(p.subKomoditas) ? safeCell(p.subKomoditas.join(', ')) : '-',
      p.tahunMulai || '-',
      p.userId?.status?.toUpperCase() || 'MENUNGGU_PERSETUJUAN',
    ]);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 || colNumber === 3 || colNumber === 11 || colNumber === 12 ? 'center' : 'left',
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
    });
  });

  worksheet.columns = [
    { width: 6 },
    { width: 28 },
    { width: 22 },
    { width: 22 },
    { width: 24 },
    { width: 18 },
    { width: 18 },
    { width: 35 },
    { width: 18 },
    { width: 25 },
    { width: 14 },
    { width: 22 },
  ];

  return workbook.xlsx.writeBuffer();
}
