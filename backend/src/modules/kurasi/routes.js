// ============================================================================
// [PBI-04] Pengajuan dan Verifikasi Kurasi Produk (FR-04)
// PIC: Abdullah
// Deskripsi: Alur verifikasi berjenjang stepper 4 tahap:
//            Tahap 1 (Profil & NIB) -> Tahap 2 (Berkas Izin) ->
//            Tahap 3 (Mutu & Kemasan) -> Tahap 4 (Keputusan & Penetapan Grade SK Kabid).
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { loadBusiness } from '../../middleware/requireActiveUmkm.js';
import * as controller from './controller.js';

const router = Router();

// [PBI-04 - AC-04-03] Daftar antrean pengajuan kurasi untuk Staf & Kabid
router.get('/', authenticate, authorize('staf'), controller.list);

// [PBI-04 - AC-04-19] Riwayat pengajuan kurasi milik pelaku usaha
router.get('/mine', authenticate, authorize('umkm'), loadBusiness, controller.listMine);

// [PBI-04 - AC-04-05] Detail tahapan pengajuan kurasi
router.get('/:id', authenticate, controller.getById);

// [PBI-04 - AC-04-04] Klaim pengambilan berkas oleh staf verifikator
router.post('/:id/ambil', authenticate, authorize('staf'), controller.claim);

// [PBI-04 - AC-04-06 s/d AC-04-09] Pemeriksaan item per tahap 1, 2, atau 3
router.patch('/:id/tahap/:n', authenticate, authorize('staf'), controller.updateStep);

// [PBI-04 - AC-04-10 s/d AC-04-12] Rekomendasi staf verifikator ke Kabid (Setuju / Revisi)
router.post('/:id/rekomendasi', authenticate, authorize('staf'), controller.recommend);

// [PBI-04 - AC-04-13 s/d AC-04-16] Keputusan akhir eksklusif Kabid (Penerbitan SK & Grade A/B)
router.post('/:id/keputusan', authenticate, authorize('kabid'), controller.decide);

// [PBI-04 - AC-04-17] Pengajuan ulang setelah UMKM memperbaiki berkas (putaran + 1)
router.post('/:id/ajukan-ulang', authenticate, authorize('umkm'), loadBusiness, controller.resubmit);

export default router;
