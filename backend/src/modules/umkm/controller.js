import { businessDto } from '../../utils/dto.js';
import { asyncHandler, ok } from '../../utils/response.js';
import * as service from './service.js';

export const getMine = asyncHandler(async (req, res) => {
  ok(res, businessDto(await service.getProfile(req.businessId)));
});

export const updateMine = asyncHandler(async (req, res) => {
  const profile = await service.updateProfile(req.businessId, req.user.id, req.body, req.ip);
  ok(res, businessDto(profile), 'Profil usaha berhasil diperbarui');
});

export const listDirectory = asyncHandler(async (req, res) => {
  const result = await service.listDirectory(req.query);
  ok(res, result.items, 'Direktori binaan UMKM', result.pagination);
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await service.getSummaryPerKecamatan();
  ok(res, data, 'Ringkasan sebaran UMKM per kecamatan');
});

export const verifyAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { keputusan, catatan } = req.body;
  const result = await service.verifyAccount(id, req.user.id, { keputusan, catatan }, req.ip);
  ok(res, result, `Akun UMKM berhasil di-${keputusan === 'setuju' ? 'setujui' : 'tolak'}`);
});
