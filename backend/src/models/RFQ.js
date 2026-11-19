// ============================================================================
// [PBI-07] Model RFQ (backend/src/models/RFQ.js)
// PIC: Naila | Skema Permintaan Pesanan Mitra & Pelacakan Kuota Agregasi
// ============================================================================

import mongoose from 'mongoose';
import { KATEGORI, STATUS_RFQ, HARGA_ACUAN_SUMBER } from '../constants/enums.js';

const rfqSchema = new mongoose.Schema(
  {
    kode: {
      type: String,
      unique: true,
      trim: true,
    },
    mitraUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    komoditasSlug: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    komoditasNama: {
      type: String,
      required: true,
      trim: true,
    },
    kategori: {
      type: String,
      enum: Object.values(KATEGORI),
      required: true,
    },
    satuan: {
      type: String,
      required: true,
      trim: true,
    },
    kuotaTotal: {
      type: Number,
      required: true,
      min: 1,
    },
    kuotaTerkumpul: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: function (v) {
          return v <= this.kuotaTotal;
        },
        message: 'kuotaTerkumpul tidak boleh melebihi kuotaTotal',
      },
    },
    hargaAcuan: {
      type: Number,
      required: true,
    },
    hargaAcuanSumber: {
      type: String,
      enum: HARGA_ACUAN_SUMBER,
      default: 'referensi_dinas',
    },
    tenggat: {
      type: Date,
      required: true,
    },
    lokasiKirim: {
      type: String,
      required: true,
      trim: true,
    },
    catatanMutu: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      default: 'draf',
      index: true,
      enum: STATUS_RFQ,
    },
    verifikasi: {
      oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      at: { type: Date },
      catatan: { type: String },
      hargaDisetujui: { type: Number },
    },
    tanggalPerkiraanSelesai: {
      type: Date,
    },
    terpenuhiAt: {
      type: Date,
    },
    riwayat: [
      {
        at: { type: Date, default: Date.now },
        oleh: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        aksi: { type: String, required: true },
        dariStatus: { type: String },
        keStatus: { type: String },
        catatan: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export const RFQ = mongoose.models.RFQ || mongoose.model('RFQ', rfqSchema);
export default RFQ;
