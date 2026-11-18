// ============================================================================
// [PBI-03] Kelola Produk & Kapasitas Produksi Bulanan (FR-03)
// PIC: Fariz
// Deskripsi: Pengelolaan draf produk usaha, penguncian kategori ke kategori usaha,
//            penetapan harga acuan, dan pemicu pengajuan kurasi.
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { loadBusiness, requireActiveUmkm } from '../../middleware/requireActiveUmkm.js';
import * as controller from './controller.js';

const router = Router();

router.use(authenticate, authorize('umkm'));

// [PBI-03 - AC-03-01 s/d AC-03-07] Daftar produk & pembuatan draf mandiri
// Catatan: Boleh buat draf walau akun masih menunggu_persetujuan (AC-03-13).
router.get('/mine', loadBusiness, controller.listMine);
router.post('/', loadBusiness, controller.create);
router.get('/:id', loadBusiness, controller.getById);

// [PBI-03 - AC-03-09 & AC-03-11] Pembaharuan produk (terkunci saat kurasi berjalan)
router.put('/:id', loadBusiness, controller.update);

// [PBI-03 - AC-03-12] Hapus produk (hanya diizinkan jika masih berstatus draf)
router.delete('/:id', loadBusiness, controller.remove);

// [PBI-03 & PBI-04 - AC-03-08] Tombol Ajukan Kurasi (wajib akun berstatus aktif)
router.post('/:id/ajukan-kurasi', requireActiveUmkm, controller.ajukanKurasi);

export default router;
