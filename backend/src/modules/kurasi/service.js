import { KurasiSubmission } from '../../models/KurasiSubmission.js';
import { Product } from '../../models/Product.js';
import { BusinessProfile } from '../../models/BusinessProfile.js';
import { LegalDocument } from '../../models/LegalDocument.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import { generateCode } from '../../utils/codeGenerator.js';
import { hitungGrade } from './grade.js';

export async function createSubmission(productId, userId, businessId, ip) {
  const product = await Product.findOne({ _id: productId, businessId });
  if (!product) throw AppError.notFound('Produk tidak ditemukan');

  // Cek pengajuan aktif
  const existing = await KurasiSubmission.findOne({
    productId,
    status: { $ne: 'disetujui' },
  });
  if (existing) {
    throw AppError.conflict('Produk ini sudah memiliki pengajuan kurasi yang sedang berjalan.');
  }

  // Cek dokumen wajib sesuai kategori
  const profile = await BusinessProfile.findById(businessId);
  if (!profile) throw AppError.notFound('Profil usaha tidak ditemukan');

  const requiredDocTypes =
    product.kategori === 'kriya_tenun'
      ? ['nib']
      : ['nib', 'spp_irt', 'halal', 'uji_umur_simpan'];

  const uploadedDocs = await LegalDocument.find({
    businessId,
    jenis: { $in: requiredDocTypes },
  });
  const uploadedTypes = uploadedDocs.map((d) => d.jenis);
  const missing = requiredDocTypes.filter((t) => !uploadedTypes.includes(t));

  if (missing.length > 0) {
    throw AppError.validation(
      `Dokumen legalitas belum lengkap. Harap unggah terlebih dahulu: ${missing.join(', ')}`,
      'DOCS_INCOMPLETE',
    );
  }

  const kode = await generateCode('KUR');

  const submission = await KurasiSubmission.create({
    kode,
    productId,
    businessId,
    status: 'menunggu_verifikasi',
    tahapAktif: 1,
    putaran: 1,
    riwayat: [
      {
        at: new Date(),
        oleh: userId,
        aksi: 'pengajuan_baru',
        keStatus: 'menunggu_verifikasi',
        catatan: 'Pengajuan kurasi baru oleh UMKM',
        putaran: 1,
      },
    ],
  });

  // Kunci produk dari penyuntingan
  product.statusKurasi = 'menunggu_verifikasi';
  await product.save();

  await auditLog.write({
    actorId: userId,
    action: 'kurasi.diajukan',
    entity: 'KurasiSubmission',
    entityId: submission._id,
    meta: { kode, productId },
    ip,
  });

  return submission;
}

export async function listSubmissions({ status, q, page = 1, limit = 10 }) {
  const query = {};
  if (status && status !== 'all') query.status = status;

  const skip = (Math.max(1, page) - 1) * limit;

  const [items, total] = await Promise.all([
    KurasiSubmission.find(query)
      .populate('productId', 'nama kategori satuan hargaAcuan fotos statusKurasi')
      .populate('businessId', 'namaUsaha kecamatan nib kategoriUtama waUsaha')
      .populate('assignedTo', 'nama email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    KurasiSubmission.countDocuments(query),
  ]);

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

export async function listMine(businessId) {
  return KurasiSubmission.find({ businessId })
    .populate('productId')
    .sort({ createdAt: -1 })
    .lean();
}

export async function getSubmissionById(id) {
  const sub = await KurasiSubmission.findById(id)
    .populate('productId')
    .populate('businessId')
    .populate('assignedTo', 'nama email noHp')
    .lean();
  if (!sub) throw AppError.notFound('Pengajuan kurasi tidak ditemukan');
  return sub;
}

export async function claimSubmission(id, stafId, ip) {
  const sub = await KurasiSubmission.findById(id);
  if (!sub) throw AppError.notFound('Pengajuan kurasi tidak ditemukan');

  if (sub.assignedTo && String(sub.assignedTo) !== String(stafId)) {
    throw AppError.conflict('Pengajuan kurasi ini sudah diambil oleh staf verifikator lain.');
  }

  sub.assignedTo = stafId;
  sub.status = 'dalam_pemeriksaan';
  sub.riwayat.push({
    at: new Date(),
    oleh: stafId,
    aksi: 'ambil_pemeriksaan',
    dariStatus: 'menunggu_verifikasi',
    keStatus: 'dalam_pemeriksaan',
    catatan: 'Staf mengambil berkas untuk verifikasi',
    putaran: sub.putaran,
  });

  await sub.save();

  await auditLog.write({
    actorId: stafId,
    action: 'kurasi.diambil',
    entity: 'KurasiSubmission',
    entityId: sub._id,
    ip,
  });

  return sub;
}

export async function updateStep(id, stafId, stepNumber, items = [], ip) {
  const sub = await KurasiSubmission.findById(id);
  if (!sub) throw AppError.notFound('Pengajuan kurasi tidak ditemukan');

  for (const item of items) {
    if (sub.checks[item.kunci]) {
      sub.checks[item.kunci] = {
        status: item.status,
        catatan: item.catatan || '',
      };
    }
  }

  sub.tahapAktif = Math.max(sub.tahapAktif, Number(stepNumber));
  await sub.save();

  await auditLog.write({
    actorId: stafId,
    action: 'kurasi.tahap_diperiksa',
    entity: 'KurasiSubmission',
    entityId: sub._id,
    meta: { stepNumber, itemsCount: items.length },
    ip,
  });

  return sub;
}

export async function submitRecommendation(id, stafId, { hasil, catatan }, ip) {
  const sub = await KurasiSubmission.findById(id).populate('productId');
  if (!sub) throw AppError.notFound('Pengajuan kurasi tidak ditemukan');

  sub.rekomendasi = {
    hasil,
    catatan,
    oleh: stafId,
    at: new Date(),
  };

  const oldStatus = sub.status;

  if (hasil === 'setuju') {
    sub.status = 'menunggu_approval';
    sub.tahapAktif = 4;
  } else {
    sub.status = 'perlu_revisi';
    if (sub.productId) {
      await Product.findByIdAndUpdate(sub.productId._id, { statusKurasi: 'perlu_revisi' });
    }
  }

  sub.riwayat.push({
    at: new Date(),
    oleh: stafId,
    aksi: 'rekomendasi_staf',
    dariStatus: oldStatus,
    keStatus: sub.status,
    catatan,
    putaran: sub.putaran,
  });

  await sub.save();

  await auditLog.write({
    actorId: stafId,
    action: 'kurasi.rekomendasi',
    entity: 'KurasiSubmission',
    entityId: sub._id,
    meta: { hasil, catatan },
    ip,
  });

  return sub;
}

export async function submitDecision(id, kabidId, { hasil, grade, catatan }, ip) {
  const sub = await KurasiSubmission.findById(id).populate('productId').populate('businessId');
  if (!sub) throw AppError.notFound('Pengajuan kurasi tidak ditemukan');

  const oldStatus = sub.status;

  if (hasil === 'setuju') {
    const nomorSK = await generateCode('SK-KUR');

    // Hitung grade bila belum disertakan
    const computedGrade =
      grade ||
      hitungGrade({
        kategori: sub.productId.kategori,
        checks: Object.fromEntries(
          Object.entries(sub.checks || {}).map(([k, v]) => [k, v.status]),
        ),
      }) ||
      'B';

    sub.keputusan = {
      hasil: 'setuju',
      grade: computedGrade,
      nomorSK,
      catatan,
      oleh: kabidId,
      at: new Date(),
    };
    sub.status = 'disetujui';

    // Perbarui produk jadi terkurasi
    await Product.findByIdAndUpdate(sub.productId._id, {
      statusKurasi: 'terkurasi',
      gradeKurasi: computedGrade,
      terkurasiAt: new Date(),
      nomorSK,
    });
  } else {
    sub.keputusan = {
      hasil: 'revisi',
      catatan,
      oleh: kabidId,
      at: new Date(),
    };
    sub.status = 'perlu_revisi';
    await Product.findByIdAndUpdate(sub.productId._id, {
      statusKurasi: 'perlu_revisi',
    });
  }

  sub.riwayat.push({
    at: new Date(),
    oleh: kabidId,
    aksi: 'keputusan_kabid',
    dariStatus: oldStatus,
    keStatus: sub.status,
    catatan,
    putaran: sub.putaran,
  });

  await sub.save();

  await auditLog.write({
    actorId: kabidId,
    action: 'kurasi.keputusan',
    entity: 'KurasiSubmission',
    entityId: sub._id,
    meta: { hasil, grade: sub.keputusan.grade, nomorSK: sub.keputusan.nomorSK },
    ip,
  });

  return sub;
}

export async function resubmit(id, userId, businessId, ip) {
  const sub = await KurasiSubmission.findOne({ _id: id, businessId }).populate('productId');
  if (!sub) throw AppError.notFound('Pengajuan kurasi tidak ditemukan');

  sub.putaran += 1;
  sub.status = 'menunggu_verifikasi';
  sub.assignedTo = null;
  sub.tahapAktif = 1;

  sub.riwayat.push({
    at: new Date(),
    oleh: userId,
    aksi: 'ajukan_ulang',
    dariStatus: 'perlu_revisi',
    keStatus: 'menunggu_verifikasi',
    catatan: 'UMKM memperbaiki dan mengajukan ulang kurasi',
    putaran: sub.putaran,
  });

  await sub.save();

  if (sub.productId) {
    await Product.findByIdAndUpdate(sub.productId._id, {
      statusKurasi: 'menunggu_verifikasi',
    });
  }

  await auditLog.write({
    actorId: userId,
    action: 'kurasi.diajukan_ulang',
    entity: 'KurasiSubmission',
    entityId: sub._id,
    meta: { putaran: sub.putaran },
    ip,
  });

  return sub;
}
