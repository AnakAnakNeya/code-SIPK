import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './controller.js';

const router = Router();

// Khusus staf & kabid (AC-06-11)
router.use(authenticate, authorize('staf'));

router.get('/', controller.listDirectory);
router.get('/summary', controller.getSummary);
router.patch('/:id/persetujuan', controller.verifyAccount);

export default router;
