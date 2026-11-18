import { userDto } from '../../utils/dto.js';
import { asyncHandler, created, ok } from '../../utils/response.js';
import * as service from './service.js';

const setAuthCookie = (res, token, maxAge) => res.cookie('token', token, service.cookieOptions(maxAge));

export const register = asyncHandler(async (req, res) => {
  const { user, business } = await service.register(req.body, req.ip);
  const { token, maxAge } = service.signToken(user);
  setAuthCookie(res, token, maxAge);
  created(res, userDto(user, business), 'Registrasi berhasil. Akun menunggu persetujuan dinas.');
});

export const login = asyncHandler(async (req, res) => {
  const { user, business, token, maxAge } = await service.login(req.body, req.ip);
  setAuthCookie(res, token, maxAge);
  ok(res, userDto(user, business), 'Berhasil masuk');
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('token', service.cookieOptions());
  ok(res, null, 'Berhasil keluar');
});

export const me = asyncHandler(async (req, res) => {
  const { user, business } = await service.getMe(req.user.id);
  ok(res, userDto(user, business));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await service.forgotPassword(req.body.email, req.ip);
  ok(res, null, 'Jika email terdaftar, tautan reset kata sandi telah dikirim.');
});

export const resetPassword = asyncHandler(async (req, res) => {
  await service.resetPassword(req.body, req.ip);
  ok(res, null, 'Kata sandi berhasil diatur ulang. Silakan masuk.');
});

export const changePassword = asyncHandler(async (req, res) => {
  await service.changePassword(req.user.id, req.body, req.ip);
  ok(res, null, 'Kata sandi berhasil diganti.');
});
