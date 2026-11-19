// ============================================================================
// [PBI-13] Controller Forum (backend/src/modules/forum/controller.js)
// PIC: Abdullah
// ============================================================================

import { z } from 'zod';
import forumService from './service.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

const threadSchema = z.object({
  judul: z.string().min(10).max(150),
  isi: z.string().min(20).max(3000),
  kategori: z.enum([
    'pengumuman_dinas',
    'legalitas_perizinan',
    'kemasan',
    'bahan_baku',
    'kolaborasi_pasokan',
    'umum',
  ]),
});

const postSchema = z.object({
  isi: z.string().min(2).max(2000),
});

export const forumController = {
  async list(req, res, next) {
    try {
      const data = await forumService.listThreads({
        kategori: req.query.kategori,
        kecamatan: req.query.kecamatan,
        q: req.query.q,
        page: req.query.page,
        limit: req.query.limit,
      });
      return sendSuccess(res, 200, 'Daftar topik diskusi forum berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async createThread(req, res, next) {
    try {
      const body = threadSchema.parse(req.body);
      const data = await forumService.createThread({
        ...body,
        user: req.user,
      });
      return sendSuccess(res, 201, 'Topik diskusi baru berhasil dibuat', data);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await forumService.getThreadById(req.params.id);
      return sendSuccess(res, 200, 'Detail topik diskusi berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async updateThread(req, res, next) {
    try {
      const data = await forumService.updateThread(req.params.id, req.body, req.user.id);
      return sendSuccess(res, 200, 'Topik diskusi berhasil diperbarui', data);
    } catch (err) {
      next(err);
    }
  },

  async deleteThread(req, res, next) {
    try {
      const data = await forumService.deleteThread(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Topik diskusi berhasil dihapus', data);
    } catch (err) {
      next(err);
    }
  },

  async createPost(req, res, next) {
    try {
      const body = postSchema.parse(req.body);
      const data = await forumService.createPost({
        threadId: req.params.id,
        isi: body.isi,
        user: req.user,
      });
      return sendSuccess(res, 201, 'Balasan diskusi berhasil dikirim', data);
    } catch (err) {
      next(err);
    }
  },

  async updatePost(req, res, next) {
    try {
      const body = postSchema.parse(req.body);
      const data = await forumService.updatePost(req.params.id, body, req.user.id);
      return sendSuccess(res, 200, 'Balasan berhasil diperbarui', data);
    } catch (err) {
      next(err);
    }
  },

  async deletePost(req, res, next) {
    try {
      const data = await forumService.deletePost(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Balasan berhasil dihapus', data);
    } catch (err) {
      next(err);
    }
  },

  async pin(req, res, next) {
    try {
      const data = await forumService.pinThread(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Topik berhasil disematkan di antrean teratas', data);
    } catch (err) {
      next(err);
    }
  },

  async unpin(req, res, next) {
    try {
      const data = await forumService.unpinThread(req.params.id);
      return sendSuccess(res, 200, 'Sematan topik berhasil dilepas', data);
    } catch (err) {
      next(err);
    }
  },

  async markAnswer(req, res, next) {
    try {
      const data = await forumService.markOfficialAnswer(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Balasan resmi ditandai sebagai Jawaban Resmi Dinas', data);
    } catch (err) {
      next(err);
    }
  },

  async hideThread(req, res, next) {
    try {
      const data = await forumService.hideThread(req.params.id, req.body, req.user.id);
      return sendSuccess(res, 200, 'Topik berhasil dimoderasi / disembunyikan', data);
    } catch (err) {
      next(err);
    }
  },

  async hidePost(req, res, next) {
    try {
      const data = await forumService.hidePost(req.params.id, req.body, req.user.id);
      return sendSuccess(res, 200, 'Balasan berhasil dimoderasi / disembunyikan', data);
    } catch (err) {
      next(err);
    }
  },
};

export default forumController;
