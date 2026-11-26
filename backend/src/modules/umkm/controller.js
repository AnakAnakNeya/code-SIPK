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

export const registerManual = asyncHandler(async (req, res) => {
  const result = await service.registerManualByDinas(req.body, req.user.id, req.ip);
  ok(res, result, 'UMKM berhasil didaftarkan secara manual oleh dinas', 201);
});

export const getDetail = asyncHandler(async (req, res) => {
  const result = await service.getUmkmDetail(req.params.id);
  ok(res, result, 'Detail profil usaha dan dokumen legalitas');
});

export const exportExcel = asyncHandler(async (req, res) => {
  const buffer = await service.exportDirectoryExcel(req.query);
  const filename = `Direktori_UMKM_Lebak_${Date.now()}.xlsx`;
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
});

export const reapply = asyncHandler(async (req, res) => {
  const result = await service.reapplyAccount(req.businessId, req.user.id, req.ip);
  ok(res, result, 'Pengajuan ulang akun berhasil dikirim');
});
