import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { loadBusiness } from '../../middleware/requireActiveUmkm.js';
import * as controller from './controller.js';

const router = Router();

// Endpoint antrean kurasi untuk Staf & Kabid
router.get('/', authenticate, authorize('staf'), controller.list);
router.get('/mine', authenticate, authorize('umkm'), loadBusiness, controller.listMine);
router.get('/:id', authenticate, controller.getById);

router.post('/:id/ambil', authenticate, authorize('staf'), controller.claim);
router.patch('/:id/tahap/:n', authenticate, authorize('staf'), controller.updateStep);
router.post('/:id/rekomendasi', authenticate, authorize('staf'), controller.recommend);

// Keputusan kurasi hanya boleh diputuskan oleh Kabid (AC-04-13)
router.post('/:id/keputusan', authenticate, authorize('kabid'), controller.decide);

// UMKM mengajukan ulang perbaikan berkas
router.post('/:id/ajukan-ulang', authenticate, authorize('umkm'), loadBusiness, controller.resubmit);

export default router;
