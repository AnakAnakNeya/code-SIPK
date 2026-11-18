import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as controller from './controller.js';

const router = Router();

// Katalog publik (AC-05-01: tanpa login)
router.get('/products', controller.list);
router.get('/products/:id', controller.getById);

// Kontak WA usaha hanya untuk pengguna yang sudah login (AC-05-09)
router.get('/products/:id/kontak', authenticate, controller.getContact);

export default router;
