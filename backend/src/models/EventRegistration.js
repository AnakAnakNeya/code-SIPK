// ============================================================================
// [PBI-12] Model EventRegistration (backend/src/models/EventRegistration.js)
// PIC: Fariz | Pendaftaran Stan Pameran & Peserta Pelatihan UMKM
// ============================================================================

import mongoose from 'mongoose';

const eventRegistrationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    status: {
      type: String,
      enum: ['menunggu_verifikasi', 'disetujui', 'ditolak', 'dibatalkan'],
      default: 'menunggu_verifikasi',
      index: true,
    },
    catatan: {
      type: String,
      trim: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indeks unik untuk mencegah pendaftaran ganda aktif oleh UMKM pada event yang sama
eventRegistrationSchema.index(
  { eventId: 1, businessId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['menunggu_verifikasi', 'disetujui'] } },
  }
);

export const EventRegistration =
  mongoose.models.EventRegistration ||
  mongoose.model('EventRegistration', eventRegistrationSchema);
export default EventRegistration;
