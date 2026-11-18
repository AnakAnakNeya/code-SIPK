// ============================================================================
// [PBI-02] Model Dokumen Izin Usaha Legalitas UMKM (LegalDocument Schema)
// ============================================================================
import mongoose from 'mongoose';
import { JENIS_DOKUMEN, STATUS_DOKUMEN } from '../constants/enums.js';

const fileSubSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    namaAsli: { type: String, required: true },
    mime: { type: String, required: true },
    ukuran: { type: Number, required: true },
  },
  { _id: false },
);

const legalDocumentSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    jenis: {
      type: String,
      enum: JENIS_DOKUMEN,
      required: true,
    },
    nomor: {
      type: String,
      trim: true,
    },
    masaBerlaku: {
      type: Date,
    },
    masaSimpanBulan: {
      type: Number,
      min: 1,
      max: 60,
    },
    file: {
      type: fileSubSchema,
      required: true,
    },
    statusVerifikasi: {
      type: String,
      enum: STATUS_DOKUMEN,
      default: 'belum_diperiksa',
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
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// 1 dokumen aktif per jenis per UMKM (AC-02-01)
legalDocumentSchema.index({ businessId: 1, jenis: 1 }, { unique: true });

// Virtual kedaluwarsa (AC-02-11)
legalDocumentSchema.virtual('kedaluwarsa').get(function () {
  if (!this.masaBerlaku) return false;
  return new Date(this.masaBerlaku).getTime() < Date.now();
});

export const LegalDocument = mongoose.model('LegalDocument', legalDocumentSchema);
export default LegalDocument;
