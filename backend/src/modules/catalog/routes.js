// ============================================================================
// [PBI-05] Katalog Produk Terkurasi & Etalase Publik (FR-05)
// PIC: Fariz
// Deskripsi: Menampilkan hanya produk berstatus 'terkurasi', pencarian teks nama/usaha,
//            filter komoditas & 28 kecamatan, serta proteksi nomor WA bagi pengguna login.
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import * as controller from './controller.js';

const router = Router();

// [PBI-05 - AC-05-01 s/d AC-05-06] Katalog publik tanpa login, filter 28 kecamatan & kategori
router.get('/products', controller.list);
router.get('/products/:id', controller.getById);

// [PBI-05 - AC-05-09] Kontak nomor WhatsApp usaha hanya ditampilkan untuk pengguna yang sudah login
router.get('/products/:id/kontak', authenticate, controller.getContact);

export default router;
