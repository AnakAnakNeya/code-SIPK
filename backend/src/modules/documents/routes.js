// ============================================================================
// [PBI-02] Dokumen Legalitas & Verifikasi Berkas Izin Usaha (FR-02)
// PIC: Abdullah
// Deskripsi: Pengelolaan berkas perizinan (NIB, SPP-IRT, Halal, Uji Umur Simpan, HKI),
//            validasi ukuran (maks 2 MB), penyimpanan privat, dan verifikasi dinas.
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { loadBusiness, maybeLoadBusiness } from '../../middleware/requireActiveUmkm.js';
import { uploadDoc } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './controller.js';
import { uploadDocumentSchema, verifyDocumentSchema } from './schemas.js';

const router = Router();

// [PBI-02 - AC-02-01 s/d AC-02-05] Unggah berkas legalitas UMKM (PDF/JPG, maks 2 MB)
// Catatan: Boleh diakses saat akun menunggu_persetujuan untuk melengkapi berkas NIB awal (AC-01-07).
router.post(
  '/',
  authenticate,
  authorize('umkm'),
  loadBusiness,
  uploadDoc.single('file'),
  validate(uploadDocumentSchema),
  controller.upload,
);

// [PBI-02 - AC-02-10] Daftar dokumen milik pelaku usaha yang login
router.get('/mine', authenticate, authorize('umkm'), loadBusiness, controller.listMine);

// [PBI-02 - AC-02-06] Hapus dokumen (hanya jika tidak terkunci oleh kurasi yang aktif)
router.delete('/:id', authenticate, authorize('umkm'), loadBusiness, controller.remove);

// [PBI-02 - AC-02-07 s/d AC-02-09] Pemeriksaan dokumen binaan oleh Staf & Kabid Dinas
router.get('/', authenticate, authorize('staf'), controller.listForBusiness);
router.patch(
  '/:id/verifikasi',
  authenticate,
  authorize('staf'),
  validate(verifyDocumentSchema),
  controller.verify,
);

// [PBI-02 - AC-02-07 & AC-02-08] Streaming berkas privat (hanya pemilik & staf/kabid, tercatat di audit log)
router.get('/:id/file', authenticate, maybeLoadBusiness, controller.getFile);

export default router;
