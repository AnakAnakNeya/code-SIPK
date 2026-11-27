import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import { JENIS_DOKUMEN } from '../../constants/enums.js';
import { LegalDocument } from '../../models/LegalDocument.js';
import { BusinessProfile } from '../../models/BusinessProfile.js';
import { KurasiSubmission } from '../../models/KurasiSubmission.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import { documentDto } from '../../utils/dto.js';

function assertObjectId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw AppError.notFound('Dokumen tidak ditemukan');
  }
}

// AC-02-06: dokumen terkunci selama kurasi berstatus menunggu_approval
async function assertNotLocked(businessId) {
  const locked = await KurasiSubmission.exists({ businessId, status: 'menunggu_approval' });
  if (locked) {
    throw new AppError(
      409,
      'DOC_LOCKED',
      'Dokumen tidak dapat diubah karena pengajuan kurasi sedang menunggu persetujuan Kabid.',
    );
  }
}

export function getRequiredDocs(kategori) {
  return kategori === 'kriya_tenun'
    ? ['nib']
    : ['nib', 'spp_irt', 'halal', 'uji_umur_simpan'];
}

export async function summaryForBusiness(businessId) {
  const profile = await BusinessProfile.findById(businessId).lean();
  if (!profile) {
    throw AppError.notFound('Profil usaha tidak ditemukan');
  }

  const docs = await LegalDocument.find({ businessId }).lean();

  // Kontrak PRD: jenis yang belum diunggah bernilai 'belum_ada'
  const perJenis = Object.fromEntries(JENIS_DOKUMEN.map((j) => [j, 'belum_ada']));
  for (const doc of docs) {
    perJenis[doc.jenis] = doc.statusVerifikasi;
  }

  const required = getRequiredDocs(profile.kategoriUtama);
  const lengkap = required.every((jenis) => perJenis[jenis] === 'valid');

  return {
    kategoriUtama: profile.kategoriUtama,
    lengkap,
    perJenis,
    required,
  };
}

export async function listDocumentsForBusiness(businessId) {
  const docs = await LegalDocument.find({ businessId }).sort({ createdAt: -1 });
  return docs.map(documentDto);
}

export async function getDocumentById(docId) {
  assertObjectId(docId);
  const doc = await LegalDocument.findById(docId);
  if (!doc) throw AppError.notFound('Dokumen tidak ditemukan');
  return doc;
}

export async function saveDocument({
  businessId,
  userId,
  jenis,
  nomor,
  masaBerlaku,
  masaSimpanBulan,
  file,
  ip,
}) {
  await assertNotLocked(businessId);

  const existing = await LegalDocument.findOne({ businessId, jenis });

  // Upsert (AC-02-05: reset status ke belum_diperiksa)
  const doc = await LegalDocument.findOneAndUpdate(
    { businessId, jenis },
    {
      nomor,
      masaBerlaku,
      masaSimpanBulan,
      file,
      statusVerifikasi: 'belum_diperiksa',
      catatan: null,
      verifiedBy: null,
      verifiedAt: null,
      uploadedBy: userId,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  // Hapus file lama dari disk setelah database berhasil diperbarui
  if (existing && existing.file?.path && existing.file.path !== file.path) {
    try {
      await fs.unlink(existing.file.path);
    } catch {
      // file mungkin sudah tidak ada
    }
  }

  await auditLog.write({
    actorId: userId,
    action: 'dokumen.diunggah',
    entity: 'LegalDocument',
    entityId: doc._id,
    meta: { jenis, nomor, namaAsli: file.namaAsli },
    ip,
  });

  return documentDto(doc);
}

export async function verifyDocument({ docId, actorId, ip, status, catatan }) {
  assertObjectId(docId);
  const doc = await LegalDocument.findById(docId);
  if (!doc) throw AppError.notFound('Dokumen tidak ditemukan');

  doc.statusVerifikasi = status;
  doc.catatan = catatan ?? null;
  doc.verifiedBy = actorId;
  doc.verifiedAt = new Date();
  await doc.save();

  await auditLog.write({
    actorId,
    action: 'dokumen.diverifikasi',
    entity: 'LegalDocument',
    entityId: doc._id,
    meta: { status, catatan },
    ip,
  });

  return documentDto(doc);
}

export async function deleteDocument({ docId, businessId, userId, ip }) {
  assertObjectId(docId);
  const doc = await LegalDocument.findOne({ _id: docId, businessId });
  if (!doc) throw AppError.notFound('Dokumen tidak ditemukan');

  if (doc.jenis === 'nib') {
    throw AppError.forbidden('Dokumen NIB tidak dapat dihapus');
  }

  await assertNotLocked(businessId);

  await LegalDocument.findByIdAndDelete(docId);

  if (doc.file?.path) {
    try {
      await fs.unlink(doc.file.path);
    } catch {
      // abaikan
    }
  }

  await auditLog.write({
    actorId: userId,
    action: 'dokumen.dihapus',
    entity: 'LegalDocument',
    entityId: docId,
    meta: { jenis: doc.jenis },
    ip,
  });

  return { success: true };
}