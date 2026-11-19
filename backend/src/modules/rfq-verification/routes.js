// ============================================================================
// [PBI-08] Rute Verifikasi RFQ (backend/src/modules/rfq-verification/routes.js)
// PIC: Abdullah
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import rfqVerificationController from './controller.js';

const router = Router();

// Antrean verifikasi RFQ dinas (Tab menunggu & kuota penuh)
router.get(
  '/',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  rfqVerificationController.getQueue
);

// Setujui & sebar RFQ ke pelaku UMKM
router.post(
  '/:id/setujui',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  rfqVerificationController.approveAndSpread
);

// Tolak RFQ dengan catatan
router.post(
  '/:id/tolak',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  rfqVerificationController.reject
);

// Setujui kuota 100% dan terbitkan PO resmi
router.post(
  '/:id/terbitkan-po',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  rfqVerificationController.approveFinal
);

// Batalkan satu alokasi oleh staf
router.post(
  '/:id/alokasi/:allocId/batalkan',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  rfqVerificationController.cancelAllocation
);

export default router;
