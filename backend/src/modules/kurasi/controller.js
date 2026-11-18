import { asyncHandler, ok, created } from '../../utils/response.js';
import * as service from './service.js';

export const list = asyncHandler(async (req, res) => {
  const { status, q, page, limit } = req.query;
  const result = await service.listSubmissions({ status, q, page, limit });
  return ok(res, result.items, 'Daftar antrean kurasi', result.pagination);
});

export const listMine = asyncHandler(async (req, res) => {
  const items = await service.listMine(req.businessId);
  return ok(res, items);
});

export const getById = asyncHandler(async (req, res) => {
  const item = await service.getSubmissionById(req.params.id);
  return ok(res, item);
});

export const claim = asyncHandler(async (req, res) => {
  const updated = await service.claimSubmission(req.params.id, req.user.id, req.ip);
  return ok(res, updated, 'Pengajuan kurasi berhasil diambil');
});

export const updateStep = asyncHandler(async (req, res) => {
  const { id, n } = req.params;
  const { items } = req.body;
  const updated = await service.updateStep(id, req.user.id, n, items, req.ip);
  return ok(res, updated, `Tahap ${n} berhasil disimpan`);
});

export const recommend = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hasil, catatan } = req.body;
  const updated = await service.submitRecommendation(id, req.user.id, { hasil, catatan }, req.ip);
  return ok(res, updated, 'Rekomendasi berhasil diajukan ke Kepala Bidang');
});

export const decide = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { hasil, grade, catatan } = req.body;
  const updated = await service.submitDecision(id, req.user.id, { hasil, grade, catatan }, req.ip);
  return ok(res, updated, 'Keputusan kurasi berhasil ditetapkan');
});

export const resubmit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updated = await service.resubmit(id, req.user.id, req.businessId, req.ip);
  return ok(res, updated, 'Pengajuan kurasi berhasil diajukan ulang');
});
