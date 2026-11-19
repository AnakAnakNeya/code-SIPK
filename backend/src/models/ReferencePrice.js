// ============================================================================
// [PBI-08] Model ReferencePrice (backend/src/models/ReferencePrice.js)
// PIC: Abdullah | Daftar Harga Acuan Resmi Dinas Koperasi & UKM Lebak
// ============================================================================

import mongoose from 'mongoose';

const referencePriceSchema = new mongoose.Schema(
  {
    komoditasSlug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    komoditasNama: {
      type: String,
      required: true,
      trim: true,
    },
    satuan: {
      type: String,
      required: true,
      trim: true,
    },
    harga: {
      type: Number,
      required: true,
      min: 1000,
    },
    riwayat: [
      {
        harga: { type: Number, required: true },
        at: { type: Date, default: Date.now },
        oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        alasan: { type: String, required: true },
      },
    ],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const ReferencePrice =
  mongoose.models.ReferencePrice || mongoose.model('ReferencePrice', referencePriceSchema);
export default ReferencePrice;
