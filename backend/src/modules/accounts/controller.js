// ============================================================================
// [PBI-16] Controller Accounts & Audit (backend/src/modules/accounts/controller.js)
// PIC: Abdullah
// ============================================================================

import { z } from 'zod';
import accountService from './service.js';
import { sendSuccess } from '../../utils/response.js';

const createUserSchema = z.object({
  nama: z.string().min(2),
  email: z.string().email(),
  noHp: z.string().min(8),
  role: z.enum(['staf', 'mitra']),
  instansi: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.enum(['aktif', 'nonaktif']),
  alasan: z.string().optional(),
});

export const accountController = {
  async listUsers(req, res, next) {
    try {
      const data = await accountService.listUsers({
        role: req.query.role,
        status: req.query.status,
        q: req.query.q,
        page: req.query.page,
        limit: req.query.limit,
      });
      return sendSuccess(res, 200, 'Daftar akun pengguna berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async createUser(req, res, next) {
    try {
      const body = createUserSchema.parse(req.body);
      const data = await accountService.createUser(body, req.user.id);
      return sendSuccess(res, 201, 'Akun pengguna baru berhasil dibuat', data);
    } catch (err) {
      next(err);
    }
  },

  async updateStatus(req, res, next) {
    try {
      const body = updateStatusSchema.parse(req.body);
      const data = await accountService.updateStatus(req.params.id, body, req.user.id);
      return sendSuccess(res, 200, 'Status akun berhasil diperbarui', data);
    } catch (err) {
      next(err);
    }
  },

  async resetPassword(req, res, next) {
    try {
      const data = await accountService.resetPassword(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Kata sandi akun berhasil direset', data);
    } catch (err) {
      next(err);
    }
  },

  async getMatrix(req, res, next) {
    try {
      const data = await accountService.getPermissionsMatrix();
      return sendSuccess(res, 200, 'Matriks hak akses sistem berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const data = await accountService.getAuditLogs({
        dari: req.query.dari,
        sampai: req.query.sampai,
        actorId: req.query.actorId,
        aksi: req.query.aksi,
        page: req.query.page,
        limit: req.query.limit,
      });
      return sendSuccess(res, 200, 'Riwayat audit trail log berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },
};

export default accountController;
