// ============================================================================
// [PBI-11] Rute Purchase Order (backend/src/modules/po/routes.js)
// PIC: Abdullah
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import poController from './controller.js';

const router = Router();

// Metadata PO berdasarkan RFQ ID
router.get(
  '/by-rfq/:rfqId',
  authenticate,
  authorize(ROLES.MITRA, ROLES.STAF, ROLES.KABID, ROLES.UMKM),
  poController.getByRfqId
);

// Detail snapshot PO
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.MITRA, ROLES.STAF, ROLES.KABID, ROLES.UMKM),
  poController.getById
);

// Unduh / stream file PDF PO resmi
router.get(
  '/:id/pdf',
  authenticate,
  authorize(ROLES.MITRA, ROLES.STAF, ROLES.KABID, ROLES.UMKM),
  poController.downloadPdf
);

export default router;
