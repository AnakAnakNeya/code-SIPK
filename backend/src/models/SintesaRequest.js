// ============================================================================
// [PBI-14] Model SintesaRequest (backend/src/models/SintesaRequest.js)
// PIC: Fariz | Pengajuan Layanan Rumah Kemasan Sintesa Dinkop UKM Lebak
// ============================================================================

import mongoose from 'mongoose';

const fotoKemasanSubSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    ukuran: { type: Number },
  },
  { _id: false }
);

const sintesaTimelineSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, required: true },
    catatan: { type: String },
  },
  { _id: false }
);

const sintesaRequestSchema = new mongoose.Schema(
  {
    kode: {
      type: String,
      unique: true,
      trim: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    tahun: {
      type: Number,
      required: true,
      index: true,
    },
    jenisFasilitasi: {
      type: String,
      enum: ['desain_kemasan', 'desain_label', 'keduanya'],
      required: true,
    },
    kondisiKemasan: {
      type: String,
      required: true,
      trim: true,
    },
    targetPasar: {
      type: String,
      required: true,
      trim: true,
    },
    fotoKemasan: [fotoKemasanSubSchema],
    usulanJadwal: {
      type: Date,
      required: true,
    },
    jadwalFinal: {
      type: Date,
    },
    desainerNama: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      default: 'diajukan',
      index: true,
      enum: [
        'diajukan',
        'dijadwalkan',
        'desain_dikerjakan',
        'selesai',
        'ditolak',
        'dibatalkan',
      ],
    },
    alasanTolak: {
      type: String,
      trim: true,
    },
    catatanHasil: {
      type: String,
      trim: true,
    },
    timeline: [sintesaTimelineSchema],
  },
  { timestamps: true }
);

export const SintesaRequest =
  mongoose.models.SintesaRequest || mongoose.model('SintesaRequest', sintesaRequestSchema);
export default SintesaRequest;
