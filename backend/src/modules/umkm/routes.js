import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { loadBusiness } from '../../middleware/requireActiveUmkm.js';
import { validate } from '../../middleware/validate.js';
import { updateProfilSchema } from '../auth/schemas.js';
import * as controller from './controller.js';

const router = Router();

// Profil bisa diakses UMKM berstatus apa pun (termasuk menunggu_persetujuan) agar data bisa dilengkapi.
router.use(authenticate, authorize('umkm'), loadBusiness);
router.get('/saya', controller.getMine);
router.put('/saya', validate(updateProfilSchema), controller.updateMine);

export default router;
