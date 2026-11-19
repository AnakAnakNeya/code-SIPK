// ============================================================================
// [PBI-12] Rute Events (backend/src/modules/events/routes.js)
// PIC: Fariz
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { requireActiveUmkm } from '../../middleware/requireActiveUmkm.js';
import { ROLES } from '../../constants/roles.js';
import eventsController from './controller.js';

const router = Router();

// Jadwal event terbuka publik (tanpa login)
router.get('/publik', eventsController.publicList);

// Riwayat partisipasi saya (UMKM)
router.get(
  '/riwayat/saya',
  authenticate,
  authorize(ROLES.UMKM),
  eventsController.myHistory
);

// Daftar event untuk login (UMKM, Staf, Kabid)
router.get(
  '/',
  authenticate,
  authorize(ROLES.UMKM, ROLES.STAF, ROLES.KABID),
  eventsController.list
);

// Detail event
router.get(
  '/:id',
  authenticate,
  authorize(ROLES.UMKM, ROLES.STAF, ROLES.KABID),
  eventsController.getById
);

// Buat event (Staf, Kabid)
router.post(
  '/',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  eventsController.create
);

// Perbarui event (Staf, Kabid)
router.put(
  '/:id',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  eventsController.update
);

// Publikasikan event (Staf, Kabid)
router.post(
  '/:id/publikasi',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  eventsController.publish
);

// Tutup pendaftaran manual (Staf, Kabid)
router.post(
  '/:id/tutup',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  eventsController.closeEvent
);

// Daftar stan event (UMKM aktif)
router.post(
  '/:id/daftar',
  authenticate,
  authorize(ROLES.UMKM),
  requireActiveUmkm,
  eventsController.register
);

// Batalkan pendaftaran mandiri (UMKM)
router.delete(
  '/:id/daftar',
  authenticate,
  authorize(ROLES.UMKM),
  requireActiveUmkm,
  eventsController.cancelRegistration
);

// Daftar peserta event (Staf, Kabid)
router.get(
  '/:id/peserta',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  eventsController.getParticipants
);

// Verifikasi peserta (Staf, Kabid)
router.patch(
  '/:id/peserta/:regId',
  authenticate,
  authorize(ROLES.STAF, ROLES.KABID),
  eventsController.verifyParticipant
);

export default router;
