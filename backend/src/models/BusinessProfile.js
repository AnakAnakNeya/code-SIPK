// ============================================================================
// [PBI-01] Model Profil Usaha Binaan & NIB 13 Digit OSS-RBA (BusinessProfile Schema)
// ============================================================================
import mongoose from 'mongoose';
import { KATEGORI } from '../constants/enums.js';
import { KECAMATAN } from '../constants/kecamatan.js';

const businessProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    namaUsaha: { type: String, required: true, trim: true },
    kecamatan: { type: String, enum: KECAMATAN, required: true, index: true },
    alamat: { type: String, required: true, trim: true },
    tahunMulai: {
      type: Number,
      min: [1950, 'Tahun mulai minimal 1950'],
      max: [new Date().getFullYear(), 'Tahun mulai tidak boleh melebihi tahun sekarang'],
    },
    waUsaha: { type: String, required: true, trim: true },
    nib: { type: String, required: true, unique: true }, // 13 digit
    kategoriUtama: { type: String, enum: Object.values(KATEGORI), required: true, index: true },
    subKomoditas: [String],
    pernyataanBenarAt: Date,
    catatanVerifikasi: String,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
  },
  { timestamps: true },
);

export const BusinessProfile =
  mongoose.models.BusinessProfile || mongoose.model('BusinessProfile', businessProfileSchema);
export default BusinessProfile;
