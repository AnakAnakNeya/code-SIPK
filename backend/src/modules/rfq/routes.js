// ============================================================================
// [PBI-07 & PBI-10] Rute RFQ (backend/src/modules/rfq/routes.js)
// PIC: Naila
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { requireActiveUmkm } from '../../middleware/requireActiveUmkm.js';
import { ROLES } from '../../constants/roles.js';
import rfqController from './controller.js';

const router = Router();

// Komoditas tersedia untuk dipesan (Mitra)
router.get(
  '/komoditas',
  authenticate,
  authorize(ROLES.MITRA),
  rfqController.getKomoditas
);

// RFQ milik mitra yang sedang login
router.get(
  '/mine',
  authenticate,
  authorize(ROLES.MITRA),
  rfqController.getMine
);

// RFQ terbuka yang cocok untuk UMKM terkurasi
router.get(
  '/terbuka',
  authenticate,
  authorize(ROLES.UMKM),
  requireActiveUmkm,
  rfqController.getOpenForUmkm
);

// Buat Draf RFQ
router.post(
  '/',
  authenticate,
  authorize(ROLES.MITRA),
  rfqController.createDraft
);

// Detail RFQ
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.MITRA, ROLES.STAF, ROLES.KABID, ROLES.UMKM),
  rfqController.getById
);

// Update Draf RFQ
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.MITRA),
  rfqController.update
);

// Hapus Draf RFQ
router.delete(
  '/:id',
  authenticate,
  authorize(ROLES.MITRA),
  rfqController.delete
);

// Ajukan RFQ untuk Verifikasi
router.post(
  '/:id/ajukan',
  authenticate,
  authorize(ROLES.MITRA),
  rfqController.submit
);

// Batalkan RFQ
router.post(
  '/:id/batalkan',
  authenticate,
  authorize(ROLES.MITRA),
  rfqController.cancel
);

export default router;
