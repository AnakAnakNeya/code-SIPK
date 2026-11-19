// ============================================================================
// [PBI-11] Model PurchaseOrder (backend/src/models/PurchaseOrder.js)
// PIC: Abdullah | Dokumen Kesepakatan Pasokan Bersama (PO Summary PDF)
// ============================================================================

import mongoose from 'mongoose';

const poAllocationSnapshotSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'BusinessProfile' },
    namaUsaha: { type: String, required: true },
    kecamatan: { type: String, required: true },
    jumlah: { type: Number, required: true },
    nilai: { type: Number, required: true },
    tanggalPerkiraanSelesai: { type: Date },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    rfqId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RFQ',
      required: true,
      unique: true,
      index: true,
    },
    nomor: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    snapshot: {
      rfqKode: { type: String, required: true },
      mitraNama: { type: String, required: true },
      mitraId: { type: String },
      komoditasNama: { type: String, required: true },
      satuan: { type: String, required: true },
      kuotaTotal: { type: Number, required: true },
      hargaAcuan: { type: Number, required: true },
      lokasiKirim: { type: String, required: true },
      catatanMutu: { type: String },
      alokasi: [poAllocationSnapshotSchema],
      totalNilai: { type: Number, required: true },
      verifikatorNama: { type: String, default: 'Bidang UMKM Dinkop UKM Lebak' },
    },
    pdfPath: {
      type: String,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const PurchaseOrder =
  mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);
export default PurchaseOrder;
