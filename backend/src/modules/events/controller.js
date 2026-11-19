// ============================================================================
// [PBI-12] Controller Events (backend/src/modules/events/controller.js)
// PIC: Fariz
// ============================================================================

import { z } from 'zod';
import eventsService from './service.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import { sendSuccess } from '../../utils/response.js';
import { AppError } from '../../utils/AppError.js';

const eventSchema = z.object({
  nama: z.string().min(5).max(150),
  jenis: z.enum(['pameran', 'pelatihan']),
  deskripsi: z.string().optional(),
  lokasi: z.string().min(3),
  tanggalMulai: z.string().min(10),
  tanggalSelesai: z.string().min(10),
  kuota: z.number().int().min(1).max(1000),
  tenggatDaftar: z.string().min(10),
  syaratKurasi: z.boolean().optional(),
});

export const eventsController = {
  async list(req, res, next) {
    try {
      const data = await eventsService.listEvents({
        status: req.query.status,
        jenis: req.query.jenis,
        user: req.user,
      });
      return sendSuccess(res, 200, 'Daftar event berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async publicList(req, res, next) {
    try {
      const data = await eventsService.getPublicEvents();
      return sendSuccess(res, 200, 'Jadwal event publik berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await eventsService.getById(req.params.id);
      return sendSuccess(res, 200, 'Detail event berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const body = eventSchema.parse(req.body);
      const data = await eventsService.create(body, req.user.id);
      return sendSuccess(res, 201, 'Event baru berhasil dibuat sebagai draf', data);
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const data = await eventsService.update(req.params.id, req.body, req.user.id);
      return sendSuccess(res, 200, 'Event berhasil diperbarui', data);
    } catch (err) {
      next(err);
    }
  },

  async publish(req, res, next) {
    try {
      const data = await eventsService.publish(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Event berhasil dipublikasikan untuk UMKM', data);
    } catch (err) {
      next(err);
    }
  },

  async closeEvent(req, res, next) {
    try {
      const data = await eventsService.closeEvent(req.params.id, req.user.id);
      return sendSuccess(res, 200, 'Pendaftaran event ditutup secara manual', data);
    } catch (err) {
      next(err);
    }
  },

  async register(req, res, next) {
    try {
      const profile = await BusinessProfile.findOne({ userId: req.user.id });
      if (!profile) throw new AppError('Profil usaha tidak ditemukan', 404);

      const data = await eventsService.register({
        eventId: req.params.id,
        businessId: profile._id,
        userId: req.user.id,
        productId: req.body.productId,
      });

      return sendSuccess(res, 201, 'Pendaftaran stan event berhasil diajukan', data);
    } catch (err) {
      next(err);
    }
  },

  async cancelRegistration(req, res, next) {
    try {
      const profile = await BusinessProfile.findOne({ userId: req.user.id });
      if (!profile) throw new AppError('Profil usaha tidak ditemukan', 404);

      const data = await eventsService.cancelRegistration({
        eventId: req.params.id,
        businessId: profile._id,
        userId: req.user.id,
      });

      return sendSuccess(res, 200, 'Pendaftaran event berhasil dibatalkan', data);
    } catch (err) {
      next(err);
    }
  },

  async myHistory(req, res, next) {
    try {
      const data = await eventsService.getMyHistory(req.user.id);
      return sendSuccess(res, 200, 'Riwayat partisipasi event berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async getParticipants(req, res, next) {
    try {
      const data = await eventsService.getParticipants(req.params.id);
      return sendSuccess(res, 200, 'Daftar peserta event berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async verifyParticipant(req, res, next) {
    try {
      const data = await eventsService.verifyParticipant(
        req.params.id,
        req.params.regId,
        req.body,
        req.user.id
      );
      return sendSuccess(res, 200, 'Keputusan verifikasi peserta berhasil disimpan', data);
    } catch (err) {
      next(err);
    }
  },
};

export default eventsController;
