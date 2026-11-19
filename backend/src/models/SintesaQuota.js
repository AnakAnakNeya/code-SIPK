// ============================================================================
// [PBI-14] Model SintesaQuota (backend/src/models/SintesaQuota.js)
// PIC: Fariz | Kuota Subsidi Cetak Kemasan Gratis Rumah Kemasan Sintesa
// ============================================================================

import mongoose from 'mongoose';

const sintesaQuotaSchema = new mongoose.Schema(
  {
    tahun: {
      type: Number,
      required: true,
      unique: true,
    },
    total: {
      type: Number,
      default: 100,
      min: 0,
    },
    terpakai: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const SintesaQuota =
  mongoose.models.SintesaQuota || mongoose.model('SintesaQuota', sintesaQuotaSchema);
export default SintesaQuota;
