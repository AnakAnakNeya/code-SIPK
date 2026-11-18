import fs from 'node:fs/promises';
import { LegalDocument } from '../../models/LegalDocument.js';
import { BusinessProfile } from '../../models/BusinessProfile.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import { documentDto } from '../../utils/dto.js';

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
  const perJenis = {};
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
  const existing = await LegalDocument.findOne({ businessId, jenis });

  // Update or insert (AC-02-05: reset status ke belum_diperiksa)
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

  // Jika ada file lama yang berbeda, hapus dari disk
  if (existing && existing.file?.path && existing.file.path !== file.path) {
    try {
      await fs.unlink(existing.file.path);
    } catch {
      // file might not exist or already removed
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
  const doc = await LegalDocument.findOne({ _id: docId, businessId });
  if (!doc) throw AppError.notFound('Dokumen tidak ditemukan');

  if (doc.jenis === 'nib') {
    throw AppError.forbidden('Dokumen NIB tidak dapat dihapus');
  }

  await LegalDocument.findByIdAndDelete(docId);

  if (doc.file?.path) {
    try {
      await fs.unlink(doc.file.path);
    } catch {
      // ignore
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
