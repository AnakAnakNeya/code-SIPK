// ============================================================================
// [PBI-13] Rute Forum Komunitas (backend/src/modules/forum/routes.js)
// PIC: Abdullah
// ============================================================================

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { requireActiveUmkm } from '../../middleware/requireActiveUmkm.js';
import { ROLES } from '../../constants/roles.js';
import forumController from './controller.js';

const router = Router();

// AC-13-05: Mitra tidak punya akses forum (hanya UMKM, Staf, Kabid)
router.use(authenticate, authorize(ROLES.UMKM, ROLES.STAF, ROLES.KABID));

// Daftar topik thread
router.get('/threads', forumController.list);

// Buat topik thread baru
router.post('/threads', forumController.createThread);

// Detail thread beserta seluruh balasannya
router.get('/threads/:id', forumController.getById);

// Sunting topik thread (15 menit)
router.put('/threads/:id', forumController.updateThread);

// Hapus topik thread
router.delete('/threads/:id', forumController.deleteThread);

// Kirim balasan thread
router.post('/threads/:id/posts', forumController.createPost);

// Sunting balasan (15 menit)
router.put('/posts/:id', forumController.updatePost);

// Hapus balasan
router.delete('/posts/:id', forumController.deletePost);

// Sematkan topik (Staf, Kabid - maks 3)
router.post(
  '/threads/:id/sematkan',
  authorize(ROLES.STAF, ROLES.KABID),
  forumController.pin
);

// Lepas sematan (Staf, Kabid)
router.post(
  '/threads/:id/lepas-sematan',
  authorize(ROLES.STAF, ROLES.KABID),
  forumController.unpin
);

// Tandai jawaban resmi dinas (Staf, Kabid)
router.post(
  '/posts/:id/jawaban-resmi',
  authorize(ROLES.STAF, ROLES.KABID),
  forumController.markAnswer
);

// Moderasi sembunyikan topik (Staf, Kabid)
router.post(
  '/threads/:id/sembunyikan',
  authorize(ROLES.STAF, ROLES.KABID),
  forumController.hideThread
);

// Moderasi sembunyikan balasan (Staf, Kabid)
router.post(
  '/posts/:id/sembunyikan',
  authorize(ROLES.STAF, ROLES.KABID),
  forumController.hidePost
);

export default router;
