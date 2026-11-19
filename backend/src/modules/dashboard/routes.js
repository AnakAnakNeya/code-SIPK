// ============================================================================
// [PBI-15] Rute Dashboard (backend/src/modules/dashboard/routes.js)
// PIC: Naila
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import dashboardController from './controller.js';

const router = Router();

// Dasbor analitik pimpinan/staf dinas
router.get(
  '/dinas',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  dashboardController.getDinas
);

// Dasbor personalisasi pelaku UMKM
router.get(
  '/umkm',
  authenticate,
  authorize(ROLES.UMKM),
  dashboardController.getUmkm
);

export default router;
