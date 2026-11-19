// ============================================================================
// [PBI-12] Model Event (backend/src/models/Event.js)
// PIC: Fariz | Pameran & Pelatihan Resmi Dinas Koperasi & UKM Lebak
// ============================================================================

import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 150,
      trim: true,
    },
    jenis: {
      type: String,
      enum: ['pameran', 'pelatihan'],
      required: true,
    },
    deskripsi: {
      type: String,
      trim: true,
    },
    lokasi: {
      type: String,
      required: true,
      trim: true,
    },
    tanggalMulai: {
      type: Date,
      required: true,
    },
    tanggalSelesai: {
      type: Date,
      required: true,
    },
    kuota: {
      type: Number,
      required: true,
      min: 1,
    },
    terisi: {
      type: Number,
      default: 0,
      min: 0,
    },
    tenggatDaftar: {
      type: Date,
      required: true,
    },
    syaratKurasi: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['draf', 'dibuka', 'ditutup'],
      default: 'draf',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const Event = mongoose.models.Event || mongoose.model('Event', eventSchema);
export default Event;
