import 'dotenv/config';

const DEFAULT_SECRET = 'dev-secret-ganti-di-production';

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sipk_lebak',
  JWT_SECRET: process.env.JWT_SECRET || DEFAULT_SECRET,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'SIPK-Lebak <no-reply@sipk-lebak.example>',
};

env.isProduction = env.NODE_ENV === 'production';
env.isDevelopment = env.NODE_ENV === 'development';

if (env.isProduction && env.JWT_SECRET === DEFAULT_SECRET) {
  throw new Error('JWT_SECRET wajib diatur di production.');
}
