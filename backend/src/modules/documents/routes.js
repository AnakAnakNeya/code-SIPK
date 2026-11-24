// ============================================================================
// [PBI-02] Dokumen Legalitas & Verifikasi Berkas Izin Usaha (FR-02)
// PIC: Abdullah
// ============================================================================

import fs from 'node:fs';
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { loadBusiness, maybeLoadBusiness } from '../../middleware/requireActiveUmkm.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './controller.js';
import { singleDocFile } from './fileGuard.js';
import { uploadDocumentSchema, verifyDocumentSchema } from './schemas.js';

const router = Router();

// Bila validasi body gagal, hapus file yang sudah terlanjur tersimpan oleh multer.
const validateOrCleanup = (schema) => (req, res, next) =>
  validate(schema)(req, res, (err) => {
    if (err && req.file?.path) fs.unlink(req.file.path, () => {});
    next(err);
  });

// [AC-02-01 s/d AC-02-05] Unggah berkas legalitas UMKM (PDF/JPG, maks 2 MB)
// Boleh diakses saat akun menunggu_persetujuan untuk melengkapi berkas awal.
router.post(
  '/',
  authenticate,
  authorize('umkm'),
  loadBusiness,
  singleDocFile,
  validateOrCleanup(uploadDocumentSchema),
  controller.upload,
);

// [AC-02-10] Daftar dokumen milik pelaku usaha yang login
router.get('/mine', authenticate, authorize('umkm'), loadBusiness, controller.listMine);

// [AC-02-06] Hapus dokumen (tidak boleh NIB, tidak boleh saat terkunci)
router.delete('/:id', authenticate, authorize('umkm'), loadBusiness, controller.remove);

// [AC-02-07 s/d AC-02-09] Pemeriksaan dokumen oleh Staf & Kabid
router.get('/', authenticate, authorize('staf'), controller.listForBusiness);
router.patch(
  '/:id/verifikasi',
  authenticate,
  authorize('staf'),
  validate(verifyDocumentSchema),
  controller.verify,
);

// [AC-02-07 & AC-02-08] Streaming berkas privat (pemilik, staf, kabid; tercatat di audit log)
router.get('/:id/file', authenticate, maybeLoadBusiness, controller.getFile);

export default router;