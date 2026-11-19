// ============================================================================
// [PBI-08] Controller ReferencePrice (backend/src/modules/reference-price/controller.js)
// PIC: Abdullah
// ============================================================================

import { z } from 'zod';
import referencePriceService from './service.js';
import { sendSuccess } from '../../utils/response.js';

const createSchema = z.object({
  komoditasSlug: z.string().min(2),
  komoditasNama: z.string().min(2),
  satuan: z.string().min(1),
  harga: z.number().int().min(1000),
});

const updateSchema = z.object({
  harga: z.number().int().min(1000),
  alasan: z.string().min(3),
});

export const referencePriceController = {
  async getList(req, res, next) {
    try {
      const data = await referencePriceService.getList();
      return sendSuccess(res, 200, 'Daftar harga acuan dinas berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async getBySlug(req, res, next) {
    try {
      const data = await referencePriceService.getBySlug(req.params.slug);
      return sendSuccess(res, 200, 'Harga acuan berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const body = createSchema.parse(req.body);
      const data = await referencePriceService.createPrice({
        ...body,
        userId: req.user.id,
      });
      return sendSuccess(res, 201, 'Harga acuan berhasil ditambahkan', data);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const body = updateSchema.parse(req.body);
      const data = await referencePriceService.updatePrice(req.params.slug, {
        ...body,
        userId: req.user.id,
      });
      return sendSuccess(res, 200, 'Harga acuan berhasil diperbarui', data);
    } catch (err) {
      next(err);
    }
  },
};

export default referencePriceController;
