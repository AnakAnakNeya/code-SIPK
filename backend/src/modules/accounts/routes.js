// ============================================================================
// [PBI-16] Rute Akun, Hak Akses, & Log Audit (backend/src/modules/accounts/routes.js)
// PIC: Abdullah | Khusus Kepala Bidang (Kabid) Dinas Koperasi & UKM Lebak
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { ROLES } from '../../constants/roles.js';
import accountController from './controller.js';

const router = Router();

// AC-16-11: Khusus Kabid
router.use(authenticate, authorize(ROLES.KABID));

// Daftar akun pengguna
router.get('/accounts', accountController.listUsers);

// Buat akun staf atau mitra baru
router.post('/accounts', accountController.createUser);

// Ubah status akun (aktif / nonaktif)
router.patch('/accounts/:id/status', accountController.updateStatus);

// Reset kata sandi pengguna
router.post('/accounts/:id/reset-password', accountController.resetPassword);

// Matriks hak akses sistem (hanya baca)
router.get('/permissions/matrix', accountController.getMatrix);

// Log audit trail
router.get('/audit-logs', accountController.getAuditLogs);

export default router;
