import { asyncHandler, ok, created } from '../../utils/response.js';
import * as service from './service.js';

export const listMine = asyncHandler(async (req, res) => {
  const items = await service.listMine(req.businessId);
  return ok(res, items);
});

export const getById = asyncHandler(async (req, res) => {
  const item = await service.getById(req.params.id, req.businessId);
  return ok(res, item);
});

export const create = asyncHandler(async (req, res) => {
  const item = await service.createProduct(req.businessId, req.user.id, req.body, req.ip);
  return created(res, item, 'Produk berhasil dibuat sebagai draf');
});

export const update = asyncHandler(async (req, res) => {
  const item = await service.updateProduct(req.params.id, req.businessId, req.user.id, req.body, req.ip);
  return ok(res, item, 'Produk berhasil diperbarui');
});

export const remove = asyncHandler(async (req, res) => {
  const result = await service.deleteProduct(req.params.id, req.businessId, req.user.id, req.ip);
  return ok(res, result, 'Draf produk berhasil dihapus');
});

export const ajukanKurasi = asyncHandler(async (req, res) => {
  const submission = await service.applyKurasi(req.params.id, req.user.id, req.businessId, req.ip);
  return created(res, submission, 'Produk berhasil diajukan untuk kurasi dinas');
});
