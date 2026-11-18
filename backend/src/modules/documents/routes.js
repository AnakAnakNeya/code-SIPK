import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { loadBusiness, maybeLoadBusiness } from '../../middleware/requireActiveUmkm.js';
import { uploadDoc } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './controller.js';
import { uploadDocumentSchema, verifyDocumentSchema } from './schemas.js';

const router = Router();

// Endpoint UMKM (bisa diakses saat menunggu_persetujuan untuk melengkapi dokumen registrasi, AC-01-07)
router.post(
  '/',
  authenticate,
  authorize('umkm'),
  loadBusiness,
  uploadDoc.single('file'),
  validate(uploadDocumentSchema),
  controller.upload,
);

router.get('/mine', authenticate, authorize('umkm'), loadBusiness, controller.listMine);
router.delete('/:id', authenticate, authorize('umkm'), loadBusiness, controller.remove);

// Endpoint Staf & Kabid
router.get('/', authenticate, authorize('staf'), controller.listForBusiness);
router.patch(
  '/:id/verifikasi',
  authenticate,
  authorize('staf'),
  validate(verifyDocumentSchema),
  controller.verify,
);

// File stream (bisa dibuka oleh pemilik, staf, dan kabid, AC-02-07)
router.get('/:id/file', authenticate, maybeLoadBusiness, controller.getFile);

export default router;
