import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { loadBusiness, requireActiveUmkm } from '../../middleware/requireActiveUmkm.js';
import * as controller from './controller.js';

const router = Router();

router.use(authenticate, authorize('umkm'));

// Boleh buat draf walau akun masih menunggu_persetujuan (AC-03-13)
router.get('/mine', loadBusiness, controller.listMine);
router.post('/', loadBusiness, controller.create);
router.get('/:id', loadBusiness, controller.getById);
router.put('/:id', loadBusiness, controller.update);
router.delete('/:id', loadBusiness, controller.remove);

// Tombol Ajukan Kurasi mewajibkan akun sudah aktif (AC-03-08, requireActiveUmkm)
router.post('/:id/ajukan-kurasi', requireActiveUmkm, controller.ajukanKurasi);

export default router;
