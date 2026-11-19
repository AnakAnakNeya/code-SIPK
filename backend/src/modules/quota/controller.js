// ============================================================================
// [PBI-09] Controller Quota (backend/src/modules/quota/controller.js)
// PIC: Fariz
// ============================================================================

import { z } from 'zod';
import quotaService from './service.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import RFQAllocation from '../../models/RFQAllocation.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

const takeQuotaSchema = z.object({
  productId: z.string().min(1),
  jumlah: z.number().int().min(1),
  tanggalPerkiraanSelesai: z.string().min(10),
});

export const quotaController = {
  async getCapacityInfo(req, res, next) {
    try {
      const { productId } = req.query;
      if (!productId) {
        throw new AppError('Query parameter productId wajib diisi', 422);
      }

      const profile = await BusinessProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Profil usaha tidak ditemukan', 404);
      }

      const data = await quotaService.getCapacityInfo({
        businessId: profile._id,
        productId,
        rfqId: req.params.id,
      });

      return sendSuccess(res, 200, 'Info kapasitas kuota berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async takeQuota(req, res, next) {
    try {
      const body = takeQuotaSchema.parse(req.body);

      const profile = await BusinessProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Profil usaha tidak ditemukan', 404);
      }

      const data = await quotaService.takeQuota({
        rfqId: req.params.id,
        businessId: profile._id,
        productId: body.productId,
        jumlah: body.jumlah,
        tanggalPerkiraanSelesai: body.tanggalPerkiraanSelesai,
        userId: req.user.id,
      });

      return sendSuccess(res, 201, 'Komitmen kuota berhasil dikunci', data);
    } catch (err) {
      next(err);
    }
  },

  async cancelMyQuota(req, res, next) {
    try {
      const profile = await BusinessProfile.findOne({ userId: req.user.id });
      if (!profile) {
        throw new AppError('Profil usaha tidak ditemukan', 404);
      }

      const allocation = await RFQAllocation.findOne({
        rfqId: req.params.id,
        businessId: profile._id,
        status: 'proses_verifikasi',
      });

      if (!allocation) {
        throw new AppError('Alokasi aktif Anda tidak ditemukan pada RFQ ini', 404);
      }

      const data = await quotaService.cancelAllocation({
        rfqId: req.params.id,
        allocationId: allocation._id,
        userId: req.user.id,
        byStaf: false,
        alasan: req.body?.alasan,
      });

      return sendSuccess(res, 200, 'Komitmen kuota berhasil dibatalkan', data);
    } catch (err) {
      next(err);
    }
  },

  async getAllocations(req, res, next) {
    try {
      const data = await quotaService.getAllocations(req.params.id);
      return sendSuccess(res, 200, 'Daftar alokasi kuota berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },
};

export default quotaController;
