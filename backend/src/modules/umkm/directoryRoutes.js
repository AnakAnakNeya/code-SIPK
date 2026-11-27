// ============================================================================
// [PBI-06] Direktori Binaan 28 Kecamatan & Persetujuan Akun Dinas (FR-14)
// PIC: Naila
// Deskripsi: Rekapitulasi sebaran UMKM binaan per 28 kecamatan Lebak,
//            antrean verifikasi pendaftaran akun mandiri, dan validasi fisik berkas NIB.
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { validate } from '../../middleware/validate.js';
import * as controller from './controller.js';
import {
  directoryQuerySchema,
  idParamSchema,
  registerManualSchema,
  verifyAccountSchema,
} from './schemas.js';

const router = Router();

// [PBI-06 - AC-06-11] Hak akses eksklusif untuk Staf dan Kabid Dinas Koperasi & UMKM
router.use(authenticate, authorize('staf'));

// [PBI-06 - AC-06-01 s/d AC-06-02] Direktori lengkap UMKM dengan filter kecamatan & status akun
router.get('/', validate(directoryQuerySchema, 'query'), controller.listDirectory);

// [PBI-06 - AC-06-03] Ringkasan jumlah binaan per 28 kecamatan Kabupaten Lebak
router.get('/summary', controller.getSummary);

// [PBI-06 - AC-06-10] Ekspor data direktori UMKM ke file spreadsheet Excel (.xlsx)
router.get('/export', validate(directoryQuerySchema, 'query'), controller.exportExcel);

// [PBI-06 - AC-06-04] Detail profil usaha, dokumen legalitas & produk untuk dinas
router.get('/:id', validate(idParamSchema, 'params'), controller.getDetail);

// [PBI-06 - AC-06-06 s/d AC-06-08] Persetujuan / penolakan akun mandiri UMKM
router.patch(
  '/:id/persetujuan',
  validate(idParamSchema, 'params'),
  validate(verifyAccountSchema),
  controller.verifyAccount,
);

// [PBI-06 - AC-06-09] Pendaftaran manual UMKM binaan oleh staf dinas (jemput bola)
router.post('/manual', validate(registerManualSchema), controller.registerManual);

export default router;
