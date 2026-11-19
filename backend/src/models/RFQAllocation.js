// ============================================================================
// [PBI-09] Model RFQAllocation (backend/src/models/RFQAllocation.js)
// PIC: Fariz | Alokasi Kuota Parsial Pesanan Kolektif UMKM
// ============================================================================

import mongoose from 'mongoose';
import { STATUS_ALOKASI } from '../constants/enums.js';

const rfqAllocationSchema = new mongoose.Schema(
  {
    rfqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RFQ',
      required: true,
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    jumlah: {
      type: Number,
      required: true,
      min: 1,
    },
    tanggalPerkiraanSelesai: {
      type: Date,
      required: true,
    },
    nilai: {
      type: Number,
      required: true, // jumlah * hargaAcuan RFQ
    },
    status: {
      type: String,
      enum: STATUS_ALOKASI,
      default: 'proses_verifikasi',
      index: true,
    },
    alasanBatal: {
      type: String,
    },
    dibatalkanOleh: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    dibatalkanAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indeks unik untuk mencegah alokasi ganda aktif oleh UMKM pada RFQ yang sama
rfqAllocationSchema.index(
  { rfqId: 1, businessId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['proses_verifikasi', 'terkonfirmasi'] } },
  }
);

export const RFQAllocation =
  mongoose.models.RFQAllocation || mongoose.model('RFQAllocation', rfqAllocationSchema);
export default RFQAllocation;
