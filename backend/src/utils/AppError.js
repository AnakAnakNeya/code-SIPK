// Error aplikasi dengan kode baku (PRD Sprint 1, Seksi 4.2).
export class AppError extends Error {
  constructor(arg1, arg2, arg3, arg4) {
    // Mendukung signature:
    // 1. (status, code, message, fields)
    // 2. (message, status, fields)
    if (typeof arg1 === 'string' && typeof arg2 === 'number') {
      super(arg1);
      this.status = arg2;
      this.code = typeof arg3 === 'string' && arg3 ? arg3 : 'APP_ERROR';
      this.fields = typeof arg3 === 'object' ? arg3 : arg4;
    } else {
      super(arg3 || (typeof arg1 === 'string' ? arg1 : ''));
      this.status = typeof arg1 === 'number' ? arg1 : 500;
      this.code = typeof arg2 === 'string' ? arg2 : 'APP_ERROR';
      this.fields = arg4;
    }
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

export default AppError;
