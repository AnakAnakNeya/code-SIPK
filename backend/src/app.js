import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/routes.js';
import umkmRoutes from './modules/umkm/routes.js';
import directoryRoutes from './modules/umkm/directoryRoutes.js';
import documentsRoutes from './modules/documents/routes.js';
import productRoutes from './modules/products/routes.js';
import kurasiRoutes from './modules/kurasi/routes.js';
import catalogRoutes from './modules/catalog/routes.js';
import referencePriceRoutes from './modules/reference-price/routes.js';
import rfqRoutes from './modules/rfq/routes.js';
import quotaRoutes from './modules/quota/routes.js';
import rfqVerificationRoutes from './modules/rfq-verification/routes.js';
import poRoutes from './modules/po/routes.js';
import eventsRoutes from './modules/events/routes.js';
import sintesaRoutes from './modules/sintesa/routes.js';
import forumRoutes from './modules/forum/routes.js';
import dashboardRoutes from './modules/dashboard/routes.js';
import accountRoutes from './modules/accounts/routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  // Catatan: folder uploads/private TIDAK diserve statis (hanya lewat endpoint ber-otorisasi).

  const api = express.Router();
  api.get('/health', (req, res) =>
    res.json({ success: true, data: { status: 'ok' }, message: 'SIPK-Lebak API berjalan' }),
  );
  api.use('/auth', authRoutes);
  api.use('/profil', umkmRoutes);
  api.use('/umkm', directoryRoutes);
  api.use('/documents', documentsRoutes);
  api.use('/products', productRoutes);
  api.use('/kurasi', kurasiRoutes);
  api.use('/catalog', catalogRoutes);
  api.use('/reference-prices', referencePriceRoutes);
  api.use('/rfq', rfqRoutes);
  api.use('/rfq', quotaRoutes);
  api.use('/rfq', rfqVerificationRoutes);
  api.use('/rfq-verifikasi', rfqVerificationRoutes);
  api.use('/po', poRoutes);
  api.use('/events', eventsRoutes);
  api.use('/sintesa', sintesaRoutes);
  api.use('/forum', forumRoutes);
  api.use('/dashboard', dashboardRoutes);
  api.use('/', accountRoutes);

  app.use('/api/v1', api);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export default createApp;
