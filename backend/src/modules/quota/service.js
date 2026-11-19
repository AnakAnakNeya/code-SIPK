// ============================================================================
// [PBI-09] Service Quota (backend/src/modules/quota/service.js)
// PIC: Fariz | Mesin Agregasi Kuota Atomik & Kontrak Kolaboratif UMKM
// ============================================================================

import mongoose from 'mongoose';
import RFQ from '../../models/RFQ.js';
import RFQAllocation from '../../models/RFQAllocation.js';
import Product from '../../models/Product.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import User from '../../models/User.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';

export const quotaService = {
  /**
   * AC-09-05: Info kapasitas produk & pemakaian bulan target
   */
  async getCapacityInfo({ businessId, productId, rfqId }) {
    const product = await Product.findOne({ _id: productId, businessId });
    if (!product) {
      throw new AppError('Produk tidak ditemukan atau bukan milik usaha Anda', 404);
    }

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) {
      throw new AppError('RFQ tidak ditemukan', 404);
    }

    const now = new Date();
    const awalBulan = new Date(now.getFullYear(), now.getMonth(), 1);
    const akhirBulan = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const terpakaiAgg = await RFQAllocation.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          status: { $in: ['proses_verifikasi', 'terkonfirmasi'] },
          tanggalPerkiraanSelesai: { $gte: awalBulan, $lte: akhirBulan },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$jumlah' },
        },
      },
    ]);

    const terpakaiBulanIni = terpakaiAgg[0]?.total || 0;
    const tersisaBulanIni = Math.max(0, product.kapasitasBulanan - terpakaiBulanIni);
    const sisaKuotaRfq = Math.max(0, rfq.kuotaTotal - rfq.kuotaTerkumpul);

    return {
      productId: product._id,
      namaProduk: product.nama,
      kapasitasBulanan: product.kapasitasBulanan,
      terpakaiBulanIni,
      tersisaBulanIni,
      sisaKuotaRfq,
      kuotaTotalRfq: rfq.kuotaTotal,
      kuotaTerkumpulRfq: rfq.kuotaTerkumpul,
      satuan: rfq.satuan,
      hargaAcuan: rfq.hargaAcuan,
    };
  },

  /**
   * AC-09-01 s/d AC-09-14: Pengambilan Kuota Secara Atomik
   */
  async takeQuota({ rfqId, businessId, productId, jumlah, tanggalPerkiraanSelesai, userId }) {
    // 1. Validasi Input Dasar
    if (!jumlah || jumlah < 1) {
      throw new AppError('Jumlah kuota harus bilangan bulat positif minimal 1', 422);
    }

    const targetDate = new Date(tanggalPerkiraanSelesai);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(targetDate.getTime()) || targetDate < today) {
      throw new AppError('Tanggal perkiraan selesai tidak boleh sebelum hari ini', 422);
    }

    // 2. Muat RFQ & Cek Status
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('RFQ tidak ditemukan', 404);

    if (rfq.status !== 'terbuka') {
      throw new AppError(
        `Pengambilan kuota ditolak: status RFQ saat ini '${rfq.status}'`,
        409
      );
    }

    if (new Date(rfq.tenggat) < new Date()) {
      throw new AppError('Tenggat waktu pengisian RFQ telah terlewati', 409);
    }

    if (targetDate > new Date(rfq.tenggat)) {
      throw new AppError(
        'Tanggal perkiraan selesai produksi tidak boleh melebihi batas tenggat RFQ',
        422
      );
    }

    // 3. Validasi Hak UMKM (Akun Aktif & Produk Terkurasi Cocok)
    const user = await User.findById(userId);
    if (!user || user.status !== 'aktif') {
      throw new AppError(
        'Akun UMKM belum aktif atau sedang dalam verifikasi dinas',
        403,
        { code: 'TIDAK_BERHAK_AMBIL_KUOTA' }
      );
    }

    const product = await Product.findOne({
      _id: productId,
      businessId,
      statusKurasi: 'terkurasi',
    });

    if (!product) {
      throw new AppError(
        'Produk yang dipilih belum berstatus terkurasi resmi oleh dinas',
        403,
        { code: 'TIDAK_BERHAK_AMBIL_KUOTA' }
      );
    }

    if (product.subKomoditasSlug !== rfq.komoditasSlug) {
      throw new AppError(
        `Komoditas produk (${product.subKomoditasSlug}) tidak cocok dengan RFQ (${rfq.komoditasSlug})`,
        422
      );
    }

    // 4. Cek Sisa Kuota RFQ
    const sisaKuota = rfq.kuotaTotal - rfq.kuotaTerkumpul;
    if (jumlah > sisaKuota) {
      throw new AppError(
        `Jumlah yang diminta melebihi sisa kuota terbuka (${sisaKuota} ${rfq.satuan})`,
        409
      );
    }

    // 5. Cek Kapasitas Bulanan Tersisa UMKM
    const capacityInfo = await this.getCapacityInfo({ businessId, productId, rfqId });
    if (jumlah > capacityInfo.tersisaBulanIni) {
      throw new AppError(
        `Jumlah melebihi sisa kapasitas bulanan produk Anda (tersisa ${capacityInfo.tersisaBulanIni} ${rfq.satuan})`,
        422
      );
    }

    // 6. Cek Apakah UMKM Sudah Memiliki Alokasi Aktif di RFQ Ini
    const existingAllocation = await RFQAllocation.findOne({
      rfqId,
      businessId,
      status: { $in: ['proses_verifikasi', 'terkonfirmasi'] },
    });
    if (existingAllocation) {
      throw new AppError(
        'Usaha Anda sudah memiliki alokasi aktif pada RFQ ini. Batalkan terlebih dahulu jika ingin mengubah.',
        409
      );
    }

    // 7. EKSEKUSI PENAMBAHAN ATOMIK PADA DOKUMEN RFQ
    const updatedRfq = await RFQ.findOneAndUpdate(
      {
        _id: rfqId,
        status: 'terbuka',
        tenggat: { $gt: new Date() },
        $expr: { $lte: [{ $add: ['$kuotaTerkumpul', jumlah] }, '$kuotaTotal'] },
      },
      [
        {
          $set: {
            kuotaTerkumpul: { $add: ['$kuotaTerkumpul', jumlah] },
            status: {
              $cond: [
                { $eq: [{ $add: ['$kuotaTerkumpul', jumlah] }, '$kuotaTotal'] },
                'proses_verifikasi',
                '$status',
              ],
            },
          },
        },
      ],
      { new: true }
    );

    if (!updatedRfq) {
      throw new AppError(
        'Gagal mengambil kuota: kuota baru saja terisi penuh atau RFQ sudah tidak terbuka',
        409
      );
    }

    // 8. Buat Dokumen RFQAllocation (dengan kompensasi rollback jika gagal)
    const nilai = jumlah * updatedRfq.hargaAcuan;
    let allocation;
    try {
      allocation = await RFQAllocation.create({
        rfqId,
        businessId,
        userId,
        productId,
        jumlah,
        tanggalPerkiraanSelesai: targetDate,
        nilai,
        status: 'proses_verifikasi',
      });
    } catch (err) {
      // Kompensasi rollback kuota jika pembuatan alokasi gagal
      await RFQ.updateOne({ _id: rfqId }, [
        {
          $set: {
            kuotaTerkumpul: { $subtract: ['$kuotaTerkumpul', jumlah] },
            status: {
              $cond: [{ $eq: ['$status', 'proses_verifikasi'] }, 'terbuka', '$status'],
            },
          },
        },
      ]);
      throw err;
    }

    // 9. Perbarui Tanggal Perkiraan Selesai RFQ (Maksimum dari seluruh alokasi)
    const latestFinish = await RFQAllocation.aggregate([
      {
        $match: {
          rfqId: new mongoose.Types.ObjectId(rfqId),
          status: { $in: ['proses_verifikasi', 'terkonfirmasi'] },
        },
      },
      {
        $group: {
          _id: null,
          maxDate: { $max: '$tanggalPerkiraanSelesai' },
        },
      },
    ]);

    const maxFinishDate = latestFinish[0]?.maxDate || targetDate;
    updatedRfq.tanggalPerkiraanSelesai = maxFinishDate;
    updatedRfq.riwayat.push({
      at: new Date(),
      oleh: userId,
      aksi: 'KUOTA_DIAMBIL',
      dariStatus: 'terbuka',
      keStatus: updatedRfq.status,
      catatan: `UMKM mengambil ${jumlah} ${updatedRfq.satuan} (akumulasi: ${updatedRfq.kuotaTerkumpul}/${updatedRfq.kuotaTotal})`,
    });
    await updatedRfq.save();

    await auditLog.write({
      userId,
      action: 'QUOTA_ALLOCATED',
      resource: 'RFQAllocation',
      resourceId: allocation._id,
      details: { rfqId, jumlah, nilai, rfqStatus: updatedRfq.status },
    });

    return {
      rfq: updatedRfq,
      allocation,
    };
  },

  /**
   * AC-09-11: Pembatalan Alokasi Kuota
   */
  async cancelAllocation({ rfqId, allocationId, userId, byStaf = false, alasan = '' }) {
    const allocation = await RFQAllocation.findOne({ _id: allocationId, rfqId });
    if (!allocation) {
      throw new AppError('Alokasi kuota tidak ditemukan', 404);
    }

    if (allocation.status === 'dibatalkan') {
      throw new AppError('Alokasi kuota ini sudah dibatalkan sebelumnya', 409);
    }

    const rfq = await RFQ.findById(rfqId);
    if (!rfq) throw new AppError('RFQ tidak ditemukan', 404);

    // Validasi wewenang pembatalan
    if (!byStaf) {
      if (String(allocation.userId) !== String(userId)) {
        throw new AppError('Anda bukan pemilik alokasi kuota ini', 403);
      }
      if (rfq.status !== 'terbuka') {
        throw new AppError(
          `Alokasi tidak dapat dibatalkan mandiri karena RFQ berstatus '${rfq.status}'`,
          409
        );
      }
    } else {
      if (byStaf && !alasan) {
        throw new AppError('Alasan pembatalan oleh dinas wajib diisi', 422);
      }
      if (!['terbuka', 'proses_verifikasi'].includes(rfq.status)) {
        throw new AppError(
          `Dinas tidak dapat membatalkan alokasi pada RFQ berstatus '${rfq.status}'`,
          409
        );
      }
    }

    // 1. Ubah status alokasi menjadi dibatalkan
    allocation.status = 'dibatalkan';
    allocation.alasanBatal = alasan || (byStaf ? 'Dibatalkan oleh Staf Dinas' : 'Dibatalkan oleh Pelaku UMKM');
    allocation.dibatalkanOleh = userId;
    allocation.dibatalkanAt = new Date();
    await allocation.save();

    // 2. Pengurangan Kuota Secara Atomik & Reset Status RFQ Menjadi Terbuka
    const updatedRfq = await RFQ.findOneAndUpdate(
      { _id: rfqId },
      [
        {
          $set: {
            kuotaTerkumpul: {
              $max: [0, { $subtract: ['$kuotaTerkumpul', allocation.jumlah] }],
            },
            status: 'terbuka',
          },
        },
      ],
      { new: true }
    );

    // 3. Hitung Ulang Tanggal Perkiraan Selesai
    const remainingFinish = await RFQAllocation.aggregate([
      {
        $match: {
          rfqId: new mongoose.Types.ObjectId(rfqId),
          status: { $in: ['proses_verifikasi', 'terkonfirmasi'] },
        },
      },
      {
        $group: {
          _id: null,
          maxDate: { $max: '$tanggalPerkiraanSelesai' },
        },
      },
    ]);

    updatedRfq.tanggalPerkiraanSelesai = remainingFinish[0]?.maxDate || null;
    updatedRfq.riwayat.push({
      at: new Date(),
      oleh: userId,
      aksi: byStaf ? 'ALOKASI_DIBATALKAN_STAF' : 'ALOKASI_DIBATALKAN_UMKM',
      dariStatus: rfq.status,
      keStatus: 'terbuka',
      catatan: `Pembatalan alokasi ${allocation.jumlah} ${rfq.satuan}. Alasan: ${allocation.alasanBatal}`,
    });
    await updatedRfq.save();

    await auditLog.write({
      userId,
      action: byStaf ? 'ALLOCATION_CANCELLED_BY_STAFF' : 'ALLOCATION_CANCELLED_BY_UMKM',
      resource: 'RFQAllocation',
      resourceId: allocation._id,
      details: { rfqId, jumlahBatal: allocation.jumlah, alasan: allocation.alasanBatal },
    });

    return {
      rfq: updatedRfq,
      allocation,
    };
  },

  /**
   * AC-10-04: Daftar Alokasi Aktif untuk RFQ Tertentu
   */
  async getAllocations(rfqId) {
    const allocations = await RFQAllocation.find({
      rfqId,
      status: { $in: ['proses_verifikasi', 'terkonfirmasi'] },
    })
      .populate('businessId', 'namaUsaha kecamatan namaPemilik')
      .populate('productId', 'nama satuan subKomoditas kapasitasBulanan')
      .sort({ createdAt: 1 });

    return allocations;
  },
};

export default quotaService;
