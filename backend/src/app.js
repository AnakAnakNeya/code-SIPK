import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/routes.js';
import umkmRoutes from './modules/umkm/routes.js';
import documentsRoutes from './modules/documents/routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  // Catatan: folder uploads/private TIDAK diserve statis (hanya lewat endpoint ber-otorisasi).

  const api = express.Router();
  api.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok' }, message: 'SIPK-Lebak API berjalan' }));
  api.use('/auth', authRoutes);
  api.use('/profil', umkmRoutes);
  api.use('/documents', documentsRoutes);
  // Modul lain didaftarkan pemiliknya: documents, kurasi (Abdullah); products, catalog (Fariz).

  app.use('/api/v1', api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
