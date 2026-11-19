// ============================================================================
// [PBI-08] Service ReferencePrice (backend/src/modules/reference-price/service.js)
// PIC: Abdullah | Layanan Harga Acuan Resmi Komoditas Unggulan Lebak
// ============================================================================

import ReferencePrice from '../../models/ReferencePrice.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';

export const referencePriceService = {
  async getList() {
    return ReferencePrice.find().sort({ komoditasNama: 1 });
  },

  async getBySlug(slug) {
    const item = await ReferencePrice.findOne({ komoditasSlug: slug });
    if (!item) {
      throw new AppError(`Harga acuan untuk komoditas '${slug}' belum terdaftar`, 404);
    }
    return item;
  },

  async createPrice({ komoditasSlug, komoditasNama, satuan, harga, userId }) {
    const exists = await ReferencePrice.findOne({ komoditasSlug });
    if (exists) {
      throw new AppError(`Harga acuan untuk '${komoditasSlug}' sudah ada`, 409);
    }

    const doc = await ReferencePrice.create({
      komoditasSlug,
      komoditasNama,
      satuan,
      harga,
      riwayat: [
        {
          harga,
          at: new Date(),
          oleh: userId,
          alasan: 'Penetapan harga acuan awal',
        },
      ],
      updatedBy: userId,
    });

    await auditLog.write({
      userId,
      action: 'REFERENCE_PRICE_CREATED',
      resource: 'ReferencePrice',
      resourceId: doc._id,
      details: { komoditasSlug, harga, satuan },
    });

    return doc;
  },

  async updatePrice(slug, { harga, alasan, userId }) {
    const doc = await ReferencePrice.findOne({ komoditasSlug: slug });
    if (!doc) {
      throw new AppError(`Harga acuan untuk '${slug}' tidak ditemukan`, 404);
    }

    doc.riwayat.push({
      harga,
      at: new Date(),
      oleh: userId,
      alasan: alasan || 'Penyesuaian berkala dinas',
    });

    doc.harga = harga;
    doc.updatedBy = userId;
    await doc.save();

    await auditLog.write({
      userId,
      action: 'REFERENCE_PRICE_UPDATED',
      resource: 'ReferencePrice',
      resourceId: doc._id,
      details: { komoditasSlug: slug, hargaBaru: harga, alasan },
    });

    return doc;
  },
};

export default referencePriceService;
