// ============================================================================
// [PBI-12] Service Events (backend/src/modules/events/service.js)
// PIC: Fariz | Layanan Pameran, Pelatihan, & Pendaftaran Stan UMKM
// ============================================================================

import mongoose from 'mongoose';
import Event from '../../models/Event.js';
import EventRegistration from '../../models/EventRegistration.js';
import Product from '../../models/Product.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import User from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import { ROLES } from '../../constants/roles.js';

export const eventsService = {
  /**
   * AC-12-03: Daftar Event untuk Pengguna Login
   */
  async listEvents({ status, jenis, user }) {
    const filter = {};
    if (jenis) filter.jenis = jenis;

    if (user.role === ROLES.UMKM) {
      filter.status = 'dibuka';
    } else if (status) {
      filter.status = status;
    }

    const events = await Event.find(filter).sort({ tanggalMulai: 1 });
    return events;
  },

  /**
   * AC-12-14: Jadwal Event Terbuka Publik (Tanpa Data Peserta)
   */
  async getPublicEvents() {
    return Event.find({ status: 'dibuka' })
      .select('nama jenis deskripsi lokasi tanggalMulai tanggalSelesai kuota terisi tenggatDaftar syaratKurasi')
      .sort({ tanggalMulai: 1 });
  },

  async getById(id) {
    const event = await Event.findById(id);
    if (!event) throw new AppError('Event tidak ditemukan', 404);
    return event;
  },

  /**
   * AC-12-01: Buat Event Baru (Staf/Kabid)
   */
  async create(data, userId) {
    const { nama, jenis, deskripsi, lokasi, tanggalMulai, tanggalSelesai, kuota, tenggatDaftar, syaratKurasi } = data;

    const tglMulai = new Date(tanggalMulai);
    const tglSelesai = new Date(tanggalSelesai);
    const tglTenggat = new Date(tenggatDaftar);

    if (tglSelesai < tglMulai) {
      throw new AppError('Tanggal selesai tidak boleh sebelum tanggal mulai', 422);
    }
    if (tglTenggat > tglMulai) {
      throw new AppError('Tenggat pendaftaran tidak boleh melebihi tanggal mulai event', 422);
    }

    const event = await Event.create({
      nama,
      jenis,
      deskripsi,
      lokasi,
      tanggalMulai: tglMulai,
      tanggalSelesai: tglSelesai,
      kuota: Number(kuota),
      terisi: 0,
      tenggatDaftar: tglTenggat,
      syaratKurasi: Boolean(syaratKurasi),
      status: 'draf',
      createdBy: userId,
    });

    await auditLog.write({
      userId,
      action: 'EVENT_CREATED',
      resource: 'Event',
      resourceId: event._id,
      details: { nama, jenis, kuota },
    });

    return event;
  },

  /**
   * AC-12-13: Perbarui Event
   */
  async update(id, data, userId) {
    const event = await Event.findById(id);
    if (!event) throw new AppError('Event tidak ditemukan', 404);

    if (data.kuota !== undefined && Number(data.kuota) < event.terisi) {
      throw new AppError(
        `Kuota tidak boleh diturunkan di bawah jumlah pendaftar saat ini (${event.terisi})`,
        422
      );
    }

    Object.assign(event, data);
    await event.save();
    return event;
  },

  /**
   * AC-12-02: Publikasikan Event
   */
  async publish(id, userId) {
    const event = await Event.findById(id);
    if (!event) throw new AppError('Event tidak ditemukan', 404);

    event.status = 'dibuka';
    await event.save();

    await auditLog.write({
      userId,
      action: 'EVENT_PUBLISHED',
      resource: 'Event',
      resourceId: event._id,
      details: { nama: event.nama },
    });

    return event;
  },

  async closeEvent(id, userId) {
    const event = await Event.findById(id);
    if (!event) throw new AppError('Event tidak ditemukan', 404);

    event.status = 'ditutup';
    await event.save();
    return event;
  },

  /**
   * AC-12-04 & AC-12-06: Pendaftaran Stan/Kursi Atomik oleh UMKM
   */
  async register({ eventId, businessId, userId, productId }) {
    const event = await Event.findById(eventId);
    if (!event) throw new AppError('Event tidak ditemukan', 404);

    if (event.status !== 'dibuka') {
      throw new AppError('Pendaftaran event ini sudah ditutup', 409);
    }

    if (new Date(event.tenggatDaftar) < new Date()) {
      throw new AppError('Batas waktu pendaftaran event telah berakhir', 409);
    }

    // Validasi syarat kurasi jika diwajibkan
    if (event.syaratKurasi) {
      const hasCurated = await Product.exists({
        businessId,
        statusKurasi: 'terkurasi',
      });
      if (!hasCurated) {
        throw new AppError(
          'Pendaftaran stan event ini mewajibkan UMKM memiliki minimal 1 produk terkurasi resmi',
          403
        );
      }
    }

    // Cek pendaftaran aktif sebelumnya
    const existing = await EventRegistration.findOne({
      eventId,
      businessId,
      status: { $in: ['menunggu_verifikasi', 'disetujui'] },
    });
    if (existing) {
      throw new AppError('Usaha Anda sudah terdaftar pada event ini', 409);
    }

    // PENAMBAHAN KURSI ATOMIK
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: eventId,
        status: 'dibuka',
        tenggatDaftar: { $gt: new Date() },
        $expr: { $lt: ['$terisi', '$kuota'] },
      },
      { $inc: { terisi: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      throw new AppError('Pendaftaran gagal: kuota stan sudah penuh', 409);
    }

    // Buat dokumen pendaftaran dengan kompensasi jika gagal
    let registration;
    try {
      registration = await EventRegistration.create({
        eventId,
        businessId,
        userId,
        productId: productId || null,
        status: 'menunggu_verifikasi',
      });
    } catch (err) {
      await Event.updateOne({ _id: eventId }, { $inc: { terisi: -1 } });
      throw err;
    }

    await auditLog.write({
      userId,
      action: 'EVENT_REGISTERED',
      resource: 'EventRegistration',
      resourceId: registration._id,
      details: { eventId, namaEvent: event.nama },
    });

    return {
      event: updatedEvent,
      registration,
    };
  },

  /**
   * AC-12-10: Batalkan Pendaftaran Mandiri oleh UMKM
   */
  async cancelRegistration({ eventId, businessId, userId }) {
    const event = await Event.findById(eventId);
    if (!event) throw new AppError('Event tidak ditemukan', 404);

    if (new Date(event.tanggalMulai) < new Date()) {
      throw new AppError('Pendaftaran tidak dapat dibatalkan karena event sudah berlangsung', 409);
    }

    const reg = await EventRegistration.findOne({
      eventId,
      businessId,
      status: { $in: ['menunggu_verifikasi', 'disetujui'] },
    });

    if (!reg) {
      throw new AppError('Pendaftaran aktif tidak ditemukan', 404);
    }

    reg.status = 'dibatalkan';
    await reg.save();

    // Kurangi kuota terisi secara atomik
    await Event.updateOne({ _id: eventId }, { $inc: { terisi: -1 } });

    await auditLog.write({
      userId,
      action: 'EVENT_REGISTRATION_CANCELLED',
      resource: 'EventRegistration',
      resourceId: reg._id,
      details: { eventId },
    });

    return { message: 'Pendaftaran berhasil dibatalkan' };
  },

  /**
   * AC-12-11: Riwayat Partisipasi UMKM
   */
  async getMyHistory(userId) {
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile) return [];

    const list = await EventRegistration.find({ businessId: profile._id })
      .populate('eventId')
      .populate('productId', 'nama satuan')
      .sort({ createdAt: -1 });

    return list;
  },

  /**
   * AC-12-12: Daftar Peserta Per Event (Staf/Kabid)
   */
  async getParticipants(eventId) {
    return EventRegistration.find({ eventId })
      .populate('businessId', 'namaUsaha kecamatan namaPemilik waUsaha')
      .populate('productId', 'nama kategori satuan gradeKurasi')
      .sort({ createdAt: 1 });
  },

  /**
   * AC-12-08: Verifikasi Peserta oleh Staf Dinas
   */
  async verifyParticipant(eventId, regId, { keputusan, catatan }, stafId) {
    const reg = await EventRegistration.findOne({ _id: regId, eventId });
    if (!reg) throw new AppError('Data pendaftaran peserta tidak ditemukan', 404);

    if (keputusan === 'setuju') {
      reg.status = 'disetujui';
      reg.catatan = catatan || 'Pendaftaran stan disetujui dinas';
    } else if (keputusan === 'tolak') {
      reg.status = 'ditolak';
      reg.catatan = catatan || 'Pendaftaran stan ditolak dinas';
      // Kembalikan kuota terisi
      await Event.updateOne({ _id: eventId }, { $inc: { terisi: -1 } });
    } else {
      throw new AppError("Keputusan harus bernilai 'setuju' atau 'tolak'", 422);
    }

    reg.verifiedBy = stafId;
    reg.verifiedAt = new Date();
    await reg.save();

    await auditLog.write({
      userId: stafId,
      action: `EVENT_PARTICIPANT_${keputusan.toUpperCase()}`,
      resource: 'EventRegistration',
      resourceId: reg._id,
      details: { eventId, keputusan, catatan: reg.catatan },
    });

    return reg;
  },
};

export default eventsService;
