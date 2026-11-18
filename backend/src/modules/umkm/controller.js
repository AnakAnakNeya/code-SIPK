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
