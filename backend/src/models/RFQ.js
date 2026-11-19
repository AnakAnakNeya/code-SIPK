// ============================================================================
// [Sprint 2 / PBI-07 & PBI-08] RFQ Schema Mongoose (backend/src/models/RFQ.js)
// Skema Permintaan Penawaran B2B Mitra & Agregasi Kuota UMKM
// ============================================================================

import mongoose from 'mongoose';

const rfqItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  namaProduk: {
    type: String,
    required: true,
  },
  targetJumlah: {
    type: Number,
    required: true,
  },
  satuan: {
    type: String,
    default: 'pcs',
  },
  hargaEkspektasi: {
    type: Number,
  },
});

const rfqSchema = new mongoose.Schema(
  {
    nomorRfq: {
      type: String,
      unique: true,
      trim: true,
    },
    mitraId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    judul: {
      type: String,
      required: true,
      trim: true,
    },
    kategori: {
      type: String,
      required: true,
    },
    deskripsi: {
      type: String,
    },
    items: [rfqItemSchema],
    tenggatWaktu: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'DIBUKA', 'SELESAI', 'DIBATALKAN'],
      default: 'DRAFT',
    },
    totalKuotaTerpenuhi: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export const RFQ = mongoose.models.RFQ || mongoose.model('RFQ', rfqSchema);
export default RFQ;
