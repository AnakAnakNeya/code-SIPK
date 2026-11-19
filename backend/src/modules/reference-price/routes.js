// ============================================================================
// [PBI-08] Rute ReferencePrice (backend/src/modules/reference-price/routes.js)
// PIC: Abdullah
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import referencePriceController from './controller.js';

const router = Router();

// Mitra, Staf, Kabid dapat membaca harga acuan
router.get(
  '/',
  authenticate,
  authorize(ROLES.MITRA, ROLES.STAF, ROLES.KABID),
  referencePriceController.getList
);

router.get(
  '/:slug',
  authenticate,
  authorize(ROLES.MITRA, ROLES.STAF, ROLES.KABID),
  referencePriceController.getBySlug
);

// Hanya Staf dan Kabid yang dapat mengelola harga acuan resmi
router.post(
  '/',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  referencePriceController.create
);

router.put(
  '/:slug',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  referencePriceController.update
);

export default router;
