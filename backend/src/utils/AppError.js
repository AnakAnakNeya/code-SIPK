// Error aplikasi dengan kode baku (PRD Sprint 1, Seksi 4.2).
export class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static validation(message, fields) {
    return new AppError(422, 'VALIDATION_ERROR', message, fields);
  }
  static unauthenticated(message = 'Silakan masuk terlebih dahulu.') {
    return new AppError(401, 'UNAUTHENTICATED', message);
  }
  static forbidden(message = 'Anda tidak memiliki akses ke sumber daya ini.', code = 'FORBIDDEN') {
    return new AppError(403, code, message);
  }
  static notFound(message = 'Data tidak ditemukan.') {
    return new AppError(404, 'NOT_FOUND', message);
  }
  static conflict(message, fields) {
    return new AppError(409, 'CONFLICT', message, fields);
  }
  static rateLimited(message) {
    return new AppError(429, 'RATE_LIMITED', message);
  }
}
