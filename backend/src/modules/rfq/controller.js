// ============================================================================
// [PBI-07 & PBI-10] Controller RFQ (backend/src/modules/rfq/controller.js)
// PIC: Naila
// ============================================================================

import { z } from 'zod';
import rfqService from './service.js';
import { sendSuccess } from '../../utils/response.js';

const draftSchema = z.object({
  komoditasSlug: z.string().min(2),
  kuotaTotal: z.number().int().min(10).max(100000),
  tenggat: z.string().datetime().or(z.string().min(10)),
  lokasiKirim: z.string().min(10).max(200),
  catatanMutu: z.string().max(500).optional(),
});

const updateSchema = z.object({
  kuotaTotal: z.number().int().min(10).max(100000).optional(),
  tenggat: z.string().datetime().or(z.string().min(10)).optional(),
  lokasiKirim: z.string().min(10).max(200).optional(),
  catatanMutu: z.string().max(500).optional(),
});

export const rfqController = {
  async getKomoditas(req, res, next) {
    try {
      const data = await rfqService.getKomoditas();
      return sendSuccess(res, 200, 'Daftar komoditas tersedia berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async getMine(req, res, next) {
    try {
      const data = await rfqService.getMine(req.user.id);
      return sendSuccess(res, 200, 'Daftar RFQ milik mitra berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async createDraft(req, res, next) {
    try {
      const body = draftSchema.parse(req.body);
      const data = await rfqService.createDraft(req.user.id, body);
      return sendSuccess(res, 201, 'Draf RFQ berhasil disimpan', data);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await rfqService.getById(req.params.id, req.user);
      return sendSuccess(res, 200, 'Detail RFQ berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const body = updateSchema.parse(req.body);
      const data = await rfqService.update(req.params.id, req.user.id, body);
      return sendSuccess(res, 200, 'Draf RFQ berhasil diperbarui', data);
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const data = await rfqService.delete(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Draf RFQ berhasil dihapus', data);
    } catch (err) {
      next(err);
    }
  },

  async submit(req, res, next) {
    try {
      const data = await rfqService.submitForVerification(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'RFQ berhasil diajukan untuk verifikasi dinas', data);
    } catch (err) {
      next(err);
    }
  },

  async cancel(req, res, next) {
    try {
      const data = await rfqService.cancel(req.params.id, req.user.id, req.body.alasan);
      return sendSuccess(res, 200, 'RFQ berhasil dibatalkan', data);
    } catch (err) {
      next(err);
    }
  },

  async getOpenForUmkm(req, res, next) {
    try {
      const data = await rfqService.getOpenRfqsForUmkm(req.user.id);
      return sendSuccess(res, 200, 'Daftar RFQ terbuka berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },
};

export default rfqController;
