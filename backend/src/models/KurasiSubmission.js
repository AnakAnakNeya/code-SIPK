// ============================================================================
// [PBI-04] Model Pengajuan & Riwayat Verifikasi Kurasi Mutu (KurasiSubmission Schema)
// ============================================================================
import mongoose from 'mongoose';
import { STATUS_KURASI } from '../constants/enums.js';

const checkItemSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['belum', 'valid', 'perlu_revisi', 'tidak_valid', 'na'],
      default: 'belum',
    },
    catatan: { type: String, trim: true },
  },
  { _id: false },
);

const riwayatItemSchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    aksi: { type: String, required: true },
    dariStatus: { type: String },
    keStatus: { type: String },
    catatan: { type: String },
    putaran: { type: Number, default: 1 },
  },
  { _id: false },
);

const kurasiSubmissionSchema = new mongoose.Schema(
  {
    kode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: STATUS_KURASI,
      default: 'menunggu_verifikasi',
      index: true,
    },
    tahapAktif: {
      type: Number,
      min: 1,
      max: 4,
      default: 1,
    },
    putaran: {
      type: Number,
      default: 1,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },

    aktif: {
      type: Boolean,
      default: true, // jadi false saat pengajuan disetujui (diatur di kurasi/service.js)
    },

    checks: {
      profil: { type: checkItemSchema, default: () => ({ status: 'belum' }) },
      nib: { type: checkItemSchema, default: () => ({ status: 'belum' }) },
      spp_irt: { type: checkItemSchema, default: () => ({ status: 'belum' }) },
      halal: { type: checkItemSchema, default: () => ({ status: 'belum' }) },
      uji_umur_simpan: { type: checkItemSchema, default: () => ({ status: 'belum' }) },
      kemasan_label: { type: checkItemSchema, default: () => ({ status: 'belum' }) },
      hak_merek: { type: checkItemSchema, default: () => ({ status: 'belum' }) },
    },
    rekomendasi: {
      hasil: { type: String, enum: ['setuju', 'revisi'] },
      catatan: { type: String, trim: true },
      oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date },
    },
    keputusan: {
      hasil: { type: String, enum: ['setuju', 'revisi'] },
      grade: { type: String, enum: ['A', 'B'] },
      catatan: { type: String, trim: true },
      nomorSK: { type: String, trim: true },
      oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date },
    },
    riwayat: {
      type: [riwayatItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Hanya satu pengajuan aktif per produk (AC-04-02).
// Catatan: partialFilterExpression MongoDB tidak mendukung $ne, jadi dipakai penanda boolean `aktif`.
kurasiSubmissionSchema.index(
  { productId: 1 },
  { unique: true, partialFilterExpression: { aktif: true } },
);

export const KurasiSubmission = mongoose.model('KurasiSubmission', kurasiSubmissionSchema);
export default KurasiSubmission;
