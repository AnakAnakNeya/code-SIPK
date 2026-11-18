import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(AppError.notFound(`Rute ${req.method} ${req.originalUrl} tidak ditemukan.`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let { status, code, message, fields } = err;

  if (err.code === 11000) {
    status = 409;
    code = 'CONFLICT';
    fields = Object.fromEntries(Object.keys(err.keyPattern ?? {}).map((k) => [k, `${k} sudah terdaftar`]));
    message = 'Data sudah terdaftar.';
  } else if (err.type === 'entity.parse.failed') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Format JSON tidak valid.';
  }

  if (!status || !(err instanceof AppError || err.code === 11000 || err.type === 'entity.parse.failed')) {
    console.error('[error]', err);
    status = 500;
    code = 'INTERNAL';
    message = 'Terjadi kesalahan pada server. Silakan coba lagi.';
    fields = undefined;
  }

  const error = { code, message };
  if (fields) error.fields = fields;
  if (env.isDevelopment && status === 500) error.detail = err.message;
  res.status(status).json({ success: false, error });
}
