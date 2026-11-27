import fs from 'node:fs';
import mongoose from 'mongoose';
import { asyncHandler, created, ok } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import * as service from './service.js';

export const upload = asyncHandler(async (req, res) => {
  try {
    if (!req.file) {
      throw new AppError(422, 'FILE_REQUIRED', 'Berkas dokumen wajib diunggah');
    }

    const { jenis, nomor, masaBerlaku, masaSimpanBulan } = req.body;

    const saved = await service.saveDocument({
      businessId: req.businessId,
      userId: req.user.id,
      jenis,
      nomor: nomor ? String(nomor).trim() : undefined,
      masaBerlaku: masaBerlaku ? new Date(masaBerlaku) : undefined,
      masaSimpanBulan: masaSimpanBulan ? Number(masaSimpanBulan) : undefined,
      file: {
        path: req.file.path,
        namaAsli: req.file.originalname,
        mime: req.file.mimetype,
        ukuran: req.file.size,
      },
      ip: req.ip,
    });

    return created(res, saved, 'Dokumen berhasil diunggah');
  } catch (err) {
    // Hapus file yang sudah terlanjur tersimpan di disk bila proses gagal (mis. DOC_LOCKED)
    if (req.file?.path) await fs.promises.unlink(req.file.path).catch(() => {});
    throw err;
  }
});

export const listMine = asyncHandler(async (req, res) => {
  const docs = await service.listDocumentsForBusiness(req.businessId);
  return ok(res, docs);
});

export const listForBusiness = asyncHandler(async (req, res) => {
  const { businessId } = req.query;
  if (!businessId || !mongoose.isValidObjectId(businessId)) {
    throw AppError.validation('Parameter businessId wajib diisi dan harus valid');
  }
  const docs = await service.listDocumentsForBusiness(businessId);
  return ok(res, docs);
});

export const getFile = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const doc = await service.getDocumentById(id);

  // Pemilik (businessId sama) ATAU staf/kabid (AC-02-07)
  const isOwner = req.businessId && String(req.businessId) === String(doc.businessId);
  const isDinas = ['staf', 'kabid'].includes(req.user?.role);

  if (!isOwner && !isDinas) {
    throw AppError.forbidden('Anda tidak memiliki akses ke dokumen ini');
  }

  // Audit log bila dibuka staf/kabid (AC-02-08)
  if (isDinas) {
    await auditLog.write({
      actorId: req.user.id,
      action: 'dokumen.dilihat',
      entity: 'LegalDocument',
      entityId: doc._id,
      meta: { businessId: doc.businessId, jenis: doc.jenis },
      ip: req.ip,
    });
  }

  if (!doc.file?.path || !fs.existsSync(doc.file.path)) {
    throw AppError.notFound('Berkas fisik dokumen tidak ditemukan');
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', doc.file.mime || 'application/octet-stream');
  res.setHeader(
    'Content-Disposition',
    `inline; filename*=UTF-8''${encodeURIComponent(doc.file.namaAsli || 'dokumen')}`,
  );

  const stream = fs.createReadStream(doc.file.path);
  stream.on('error', (e) => {
    if (!res.headersSent) next(e);
    else res.destroy();
  });
  stream.pipe(res);
});

export const verify = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, catatan } = req.body;

  const updated = await service.verifyDocument({
    docId: id,
    actorId: req.user.id,
    ip: req.ip,
    status,
    catatan,
  });

  return ok(res, updated, 'Status verifikasi dokumen berhasil diperbarui');
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await service.deleteDocument({
    docId: id,
    businessId: req.businessId,
    userId: req.user.id,
    ip: req.ip,
  });
  return ok(res, result, 'Dokumen berhasil dihapus');
});