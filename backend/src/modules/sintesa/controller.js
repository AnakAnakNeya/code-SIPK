// ============================================================================
// [PBI-14] Controller Sintesa (backend/src/modules/sintesa/controller.js)
// PIC: Fariz
// ============================================================================

import { z } from 'zod';
import sintesaService from './service.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

const requestSchema = z.object({
  productId: z.string().min(1),
  jenisFasilitasi: z.enum(['desain_kemasan', 'desain_label', 'keduanya']),
  kondisiKemasan: z.string().min(5),
  targetPasar: z.string().min(3),
  usulanJadwal: z.string().min(10),
});

export const sintesaController = {
  async getQuota(req, res, next) {
    try {
      const data = await sintesaService.getQuota();
      return sendSuccess(res, 200, 'Kuota subsidi cetak Sintesa berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async checkEligibility(req, res, next) {
    try {
      const data = await sintesaService.checkEligibility(req.user.id);
      return sendSuccess(res, 200, 'Data kelayakan fasilitasi Sintesa berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const body = requestSchema.parse(req.body);
      const profile = await BusinessProfile.findOne({ userId: req.user.id });
      if (!profile) throw new AppError('Profil usaha tidak ditemukan', 404);

      const data = await sintesaService.createRequest({
        ...body,
        businessId: profile._id,
        userId: req.user.id,
      });

      return sendSuccess(res, 201, 'Pengajuan fasilitasi Rumah Kemasan Sintesa berhasil dikirim', data);
    } catch (err) {
      next(err);
    }
  },

  async getMine(req, res, next) {
    try {
      const data = await sintesaService.getMyRequests(req.user.id);
      return sendSuccess(res, 200, 'Daftar pengajuan Sintesa saya berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await sintesaService.getById(req.params.id, req.user);
      return sendSuccess(res, 200, 'Detail pengajuan Sintesa berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const data = await sintesaService.cancelRequest(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Pengajuan Sintesa berhasil dibatalkan', data);
    } catch (err) {
      next(err);
    }
  },

  async listAll(req, res, next) {
    try {
      const data = await sintesaService.listAll({ status: req.query.status });
      return sendSuccess(res, 200, 'Antrean pengajuan Sintesa berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async setSchedule(req, res, next) {
    try {
      const { jadwalFinal } = req.body;
      if (!jadwalFinal) throw new AppError('Jadwal final tatap muka wajib diisi', 422);

      const data = await sintesaService.setSchedule(req.params.id, { jadwalFinal }, req.user.id);
      return sendSuccess(res, 200, 'Jadwal konsultasi kemasan berhasil ditetapkan', data);
    } catch (err) {
      next(err);
    }
  },

  async setDesigner(req, res, next) {
    try {
      const { desainerNama } = req.body;
      if (!desainerNama) throw new AppError('Nama desainer/konsultan wajib diisi', 422);

      const data = await sintesaService.setDesigner(req.params.id, { desainerNama }, req.user.id);
      return sendSuccess(res, 200, 'Desainer ditetapkan & kuota cetak berhasil dipotong', data);
    } catch (err) {
      next(err);
    }
  },

  async complete(req, res, next) {
    try {
      const data = await sintesaService.completeRequest(
        req.params.id,
        { catatanHasil: req.body.catatanHasil },
        req.user.id
      );
      return sendSuccess(res, 200, 'Pengajuan Sintesa ditandai selesai', data);
    } catch (err) {
      next(err);
    }
  },

  async reject(req, res, next) {
    try {
      const { alasan } = req.body;
      if (!alasan) throw new AppError('Alasan penolakan wajib diisi', 422);

      const data = await sintesaService.rejectRequest(req.params.id, { alasan }, req.user.id);
      return sendSuccess(res, 200, 'Pengajuan Sintesa berhasil ditolak dengan catatan', data);
    } catch (err) {
      next(err);
    }
  },
};

export default sintesaController;
