// ============================================================================
// [PBI-08] Controller RFQ Verification (backend/src/modules/rfq-verification/controller.js)
// PIC: Abdullah
// ============================================================================

import { z } from 'zod';
import rfqVerificationService from './service.js';
import { sendSuccess } from '../../utils/response.js';

const approveSchema = z.object({
  hargaAcuan: z.number().int().min(1000).optional(),
  alasanHarga: z.string().optional(),
});

const rejectSchema = z.object({
  catatan: z.string().min(5),
});

const cancelAllocSchema = z.object({
  alasan: z.string().min(5),
});

export const rfqVerificationController = {
  async getQueue(req, res, next) {
    try {
      const data = await rfqVerificationService.getQueue({
        tab: req.query.tab || 'menunggu',
      });
      return sendSuccess(res, 200, 'Antrean verifikasi RFQ berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async approveAndSpread(req, res, next) {
    try {
      const body = approveSchema.parse(req.body);
      const data = await rfqVerificationService.approveAndSpread(
        req.params.id,
        req.user.id,
        body
      );
      return sendSuccess(res, 200, 'RFQ berhasil disetujui dan disebarkan ke UMKM', data);
    } catch (err) {
      next(err);
    }
  },

  async reject(req, res, next) {
    try {
      const body = rejectSchema.parse(req.body);
      const data = await rfqVerificationService.reject(
        req.params.id,
        req.user.id,
        body
      );
      return sendSuccess(res, 200, 'RFQ berhasil ditolak dengan catatan', data);
    } catch (err) {
      next(err);
    }
  },

  async approveFinal(req, res, next) {
    try {
      const data = await rfqVerificationService.approveFinal(
        req.params.id,
        req.user.id
      );
      return sendSuccess(res, 200, 'Kuota terverifikasi dan PO resmi berhasil diterbitkan', data);
    } catch (err) {
      next(err);
    }
  },

  async cancelAllocation(req, res, next) {
    try {
      const body = cancelAllocSchema.parse(req.body);
      const data = await rfqVerificationService.cancelAllocationByStaf(
        req.params.id,
        req.params.allocId,
        req.user.id,
        body
      );
      return sendSuccess(res, 200, 'Alokasi berhasil dibatalkan oleh dinas', data);
    } catch (err) {
      next(err);
    }
  },
};

export default rfqVerificationController;
