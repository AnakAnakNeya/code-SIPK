// ============================================================================
// [PBI-09] Rute Quota & Alokasi (backend/src/modules/quota/routes.js)
// PIC: Fariz
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { requireActiveUmkm } from '../../middleware/requireActiveUmkm.js';
import { ROLES } from '../../constants/roles.js';
import quotaController from './controller.js';

const router = Router();

// Ambil info kapasitas produk untuk RFQ tertentu (UMKM)
router.get(
  '/:id/kuota/info',
  authenticate,
  authorize(ROLES.UMKM),
  requireActiveUmkm,
  quotaController.getCapacityInfo
);

// Kunci komitmen kuota (UMKM)
router.post(
  '/:id/kuota',
  authenticate,
  authorize(ROLES.UMKM),
  requireActiveUmkm,
  quotaController.takeQuota
);

// Batalkan komitmen kuota milik sendiri (UMKM)
router.delete(
  '/:id/kuota',
  authenticate,
  authorize(ROLES.UMKM),
  requireActiveUmkm,
  quotaController.cancelMyQuota
);

// Daftar seluruh alokasi kuota pada RFQ (Mitra pemilik, Dinas, UMKM)
router.get(
  '/:id/alokasi',
  authenticate,
  authorize(ROLES.MITRA, ROLES.STAF, ROLES.KABID, ROLES.UMKM),
  quotaController.getAllocations
);

export default router;
