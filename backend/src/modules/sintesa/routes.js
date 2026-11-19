// ============================================================================
// [PBI-14] Rute Sintesa (backend/src/modules/sintesa/routes.js)
// PIC: Fariz
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { requireActiveUmkm } from '../../middleware/requireActiveUmkm.js';
import { ROLES } from '../../constants/roles.js';
import sintesaController from './controller.js';

const router = Router();

// Kuota subsidi cetak kemasan dinas (Semua login)
router.get(
  '/kuota',
  authenticate,
  authorize(ROLES.UMKM, ROLES.STAF, ROLES.KABID),
  sintesaController.getQuota
);

// Cek kelayakan & daftar produk terkurasi (UMKM)
router.get(
  '/syarat',
  authenticate,
  authorize(ROLES.UMKM),
  requireActiveUmkm,
  sintesaController.checkEligibility
);

// Pengajuan Sintesa saya (UMKM)
router.get(
  '/mine',
  authenticate,
  authorize(ROLES.UMKM),
  sintesaController.getMine
);

// Buat pengajuan baru (UMKM)
router.post(
  '/',
  authenticate,
  authorize(ROLES.UMKM),
  requireActiveUmkm,
  sintesaController.create
);

// Antrean semua pengajuan Sintesa (Staf, Kabid)
router.get(
  '/',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  sintesaController.listAll
);

// Detail pengajuan
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.UMKM, ROLES.STAF, ROLES.KABID),
  sintesaController.getById
);

// Batalkan pengajuan (UMKM)
router.post(
  '/:id/batalkan',
  authenticate,
  authorize(ROLES.UMKM),
  sintesaController.cancel
);

// Atur jadwal konsultasi (Staf, Kabid)
router.post(
  '/:id/jadwal',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  sintesaController.setSchedule
);

// Tetapkan desainer & potong kuota cetak (Staf, Kabid)
router.post(
  '/:id/desainer',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  sintesaController.setDesigner
);

// Selesai (Staf, Kabid)
router.post(
  '/:id/selesai',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  sintesaController.complete
);

// Tolak dengan alasan (Staf, Kabid)
router.post(
  '/:id/tolak',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  sintesaController.reject
);

export default router;
