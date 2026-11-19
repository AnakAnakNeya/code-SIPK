// ============================================================================
// [PBI-08] Service RFQ Verification (backend/src/modules/rfq-verification/service.js)
// PIC: Abdullah | Layanan Verifikasi RFQ & Approval Penerbitan PO Dinas
// ============================================================================

import RFQ from '../../models/RFQ.js';
import RFQAllocation from '../../models/RFQAllocation.js';
import quotaService from '../quota/service.js';
import poService from '../po/service.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';

export const rfqVerificationService = {
  /**
   * AC-08-01: Antrean Verifikasi RFQ (Tab Menunggu & Kuota Penuh)
   */
  async getQueue({ tab = 'menunggu' }) {
    const statusFilter =
      tab === 'kuota_penuh' ? 'proses_verifikasi' : 'menunggu_verifikasi';

    const rfqs = await RFQ.find({ status: statusFilter })
      .populate('mitraUserId', 'nama email noHp mitraId')
      .sort({ createdAt: -1 });

    const results = await Promise.all(
      rfqs.map(async (rfqDoc) => {
        const rfqObj = rfqDoc.toObject();
        if (tab === 'kuota_penuh') {
          rfqObj.alokasi = await RFQAllocation.find({
            rfqId: rfqDoc._id,
            status: { $in: ['proses_verifikasi', 'terkonfirmasi'] },
          })
            .populate('businessId', 'namaUsaha kecamatan')
            .populate('productId', 'nama satuan');
        }
        return rfqObj;
      })
    );

    return results;
  },

  /**
   * AC-08-02 & AC-08-03: Setujui dan Sebar RFQ ke Komunitas UMKM
   */
  async approveAndSpread(rfqId, stafId, { hargaAcuan, alasanHarga }) {
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('Dokumen RFQ tidak ditemukan', 404);

    if (rfq.status !== 'menunggu_verifikasi') {
      throw new AppError(
        `RFQ tidak dapat disetujui: status saat ini adalah '${rfq.status}'`,
        409
      );
    }

    if (new Date(rfq.tenggat) < new Date()) {
      throw new AppError('Tenggat waktu RFQ sudah lewat dari hari ini', 422);
    }

    // Penyesuaian harga acuan resmi jika ditentukan oleh staf
    if (hargaAcuan && Number(hargaAcuan) > 0) {
      rfq.hargaAcuan = Number(hargaAcuan);
      rfq.verifikasi.hargaDisetujui = Number(hargaAcuan);
    }

    rfq.status = 'terbuka';
    rfq.verifikasi = {
      oleh: stafId,
      at: new Date(),
      catatan: alasanHarga || 'Disetujui dan disebarkan ke pelaku UMKM Lebak',
      hargaDisetujui: rfq.hargaAcuan,
    };

    rfq.riwayat.push({
      at: new Date(),
      oleh: stafId,
      aksi: 'DISETUJUI_DAN_DISEBAR',
      dariStatus: 'menunggu_verifikasi',
      keStatus: 'terbuka',
      catatan: rfq.verifikasi.catatan,
    });

    await rfq.save();

    await auditLog.write({
      userId: stafId,
      action: 'RFQ_APPROVED_AND_OPENED',
      resource: 'RFQ',
      resourceId: rfq._id,
      details: { kode: rfq.kode, hargaAcuan: rfq.hargaAcuan },
    });

    return rfq;
  },

  /**
   * AC-08-02: Tolak RFQ dengan Catatan
   */
  async reject(rfqId, stafId, { catatan }) {
    if (!catatan || catatan.trim().length < 5) {
      throw new AppError('Catatan alasan penolakan wajib diisi minimal 5 karakter', 422, {
        catatan: 'Catatan alasan penolakan wajib diisi',
      });
    }

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('Dokumen RFQ tidak ditemukan', 404);

    if (rfq.status !== 'menunggu_verifikasi') {
      throw new AppError(
        `RFQ tidak dapat ditolak: status saat ini adalah '${rfq.status}'`,
        409
      );
    }

    rfq.status = 'ditolak';
    rfq.verifikasi = {
      oleh: stafId,
      at: new Date(),
      catatan,
    };

    rfq.riwayat.push({
      at: new Date(),
      oleh: stafId,
      aksi: 'DITOLAK_STAF',
      dariStatus: 'menunggu_verifikasi',
      keStatus: 'ditolak',
      catatan,
    });

    await rfq.save();

    await auditLog.write({
      userId: stafId,
      action: 'RFQ_REJECTED_BY_STAFF',
      resource: 'RFQ',
      resourceId: rfq._id,
      details: { kode: rfq.kode, catatan },
    });

    return rfq;
  },

  /**
   * AC-08-06: Setujui Kuota Penuh & Terbitkan Dokumen PO Summary
   */
  async approveFinal(rfqId, stafId) {
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('Dokumen RFQ tidak ditemukan', 404);

    if (rfq.status !== 'proses_verifikasi') {
      throw new AppError(
        `Penerbitan PO gagal: status RFQ harus 'proses_verifikasi', saat ini '${rfq.status}'`,
        409
      );
    }

    if (rfq.kuotaTerkumpul !== rfq.kuotaTotal) {
      throw new AppError(
        `Penerbitan PO gagal: kuota belum terpenuhi 100% (${rfq.kuotaTerkumpul}/${rfq.kuotaTotal})`,
        409
      );
    }

    // Update status RFQ ke terpenuhi secara atomik
    const updatedRfq = await RFQ.findOneAndUpdate(
      { _id: rfqId, status: 'proses_verifikasi' },
      {
        $set: {
          status: 'terpenuhi',
          terpenuhiAt: new Date(),
        },
        $push: {
          riwayat: {
            at: new Date(),
            oleh: stafId,
            aksi: 'PO_DITERBITKAN',
            dariStatus: 'proses_verifikasi',
            keStatus: 'terpenuhi',
            catatan: 'Kuota lengkap diverifikasi. Dokumen PO resmi diterbitkan.',
          },
        },
      },
      { new: true }
    );

    if (!updatedRfq) {
      throw new AppError('RFQ sedang diproses oleh staf lain atau status telah berubah', 409);
    }

    // Ubah seluruh alokasi menjadi terkonfirmasi
    await RFQAllocation.updateMany(
      { rfqId, status: 'proses_verifikasi' },
      { status: 'terkonfirmasi' }
    );

    // Terbitkan dokumen Purchase Order PDF
    const po = await poService.generate(rfqId, stafId);

    await auditLog.write({
      userId: stafId,
      action: 'PO_GENERATED_FINAL',
      resource: 'PurchaseOrder',
      resourceId: po._id,
      details: { rfqKode: updatedRfq.kode, poNomor: po.nomor },
    });

    return {
      rfq: updatedRfq,
      purchaseOrder: po,
    };
  },

  /**
   * AC-08-07: Batalkan Satu Alokasi oleh Staf
   */
  async cancelAllocationByStaf(rfqId, allocId, stafId, { alasan }) {
    return quotaService.cancelAllocation({
      rfqId,
      allocationId: allocId,
      userId: stafId,
      byStaf: true,
      alasan,
    });
  },
};

export default rfqVerificationService;
