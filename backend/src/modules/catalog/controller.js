import { asyncHandler, ok } from '../../utils/response.js';
import * as service from './service.js';

export const list = asyncHandler(async (req, res) => {
  const result = await service.listProducts(req.query);
  return ok(res, result.items, 'Katalog produk terkurasi dinas', result.pagination);
});

export const getById = asyncHandler(async (req, res) => {
  const item = await service.getProductById(req.params.id);
  return ok(res, item);
});

export const getContact = asyncHandler(async (req, res) => {
  const kontak = await service.getContact(req.params.id);
  return ok(res, kontak);
});
