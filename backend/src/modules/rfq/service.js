// ============================================================================
// [PBI-07 & PBI-10] Service RFQ (backend/src/modules/rfq/service.js)
// PIC: Naila | Layanan Permintaan Pesanan Mitra & Etalase RFQ Terbuka UMKM
// ============================================================================

import mongoose from 'mongoose';
import RFQ from '../../models/RFQ.js';
import Product from '../../models/Product.js';
import ReferencePrice from '../../models/ReferencePrice.js';
import RFQAllocation from '../../models/RFQAllocation.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import { generateCode } from '../../utils/codeGenerator.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import { ROLES } from '../../constants/roles.js';

export const rfqService = {
  /**
   * AC-07-02: Daftar komoditas yang punya minimal 1 produk terkurasi dari UMKM aktif
   */
  async getKomoditas() {
    const raw = await Product.aggregate([
      { $match: { statusKurasi: 'terkurasi' } },
      {
        $lookup: {
          from: 'businessprofiles',
          localField: 'businessId',
          foreignField: '_id',
          as: 'u',
        },
      },
      { $unwind: '$u' },
      {
        $lookup: {
          from: 'users',
          localField: 'u.userId',
          foreignField: '_id',
          as: 'usr',
        },
      },
      { $unwind: '$usr' },
      { $match: { 'usr.status': 'aktif' } },
      {
        $group: {
          _id: '$subKomoditasSlug',
          nama: { $first: '$subKomoditas' },
          satuan: { $first: '$satuan' },
          kategori: { $first: '$kategori' },
          jumlahProduk: { $sum: 1 },
          umkmIds: { $addToSet: '$businessId' },
          totalKapasitas: { $sum: '$kapasitasBulanan' },
          avgHarga: { $avg: '$hargaAcuan' },
        },
      },
      { $sort: { nama: 1 } },
    ]);

    // Enrich dengan ReferencePrice jika ada
    const result = await Promise.all(
      raw.map(async (item) => {
        const refPrice = await ReferencePrice.findOne({ komoditasSlug: item._id });
        const hargaAcuan = refPrice
          ? refPrice.harga
          : Math.round((item.avgHarga || 10000) / 500) * 500;
        const hargaAcuanSumber = refPrice ? 'referensi_dinas' : 'rata_rata_produk';

        return {
          komoditasSlug: item._id,
          komoditasNama: item.nama,
          satuan: item.satuan,
          kategori: item.kategori,
          jumlahProduk: item.jumlahProduk,
          jumlahUmkm: item.umkmIds.length,
          totalKapasitasBulanan: item.totalKapasitas,
          hargaAcuan,
          hargaAcuanSumber,
        };
      })
    );

    return result;
  },

  /**
   * AC-07-09: Daftar RFQ milik mitra yang sedang login
   */
  async getMine(mitraUserId) {
    return RFQ.find({ mitraUserId }).sort({ createdAt: -1 });
  },

  /**
   * AC-07-03 & AC-07-07: Membuat Draf RFQ
   */
  async createDraft(mitraUserId, data) {
    const { komoditasSlug, kuotaTotal, tenggat, lokasiKirim, catatanMutu } = data;

    // Validasi tenggat (minimal 7 hari, maksimal 90 hari)
    const targetDate = new Date(tenggat);
    const now = new Date();
    const minDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const maxDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    if (targetDate < minDate || targetDate > maxDate) {
      throw new AppError(
        'Tenggat harus minimal 7 hari dan maksimal 90 hari dari hari ini',
        422,
        { tenggat: 'Tenggat harus antara 7 hingga 90 hari ke depan' }
      );
    }

    // Ambil info komoditas dari produk terkurasi
    const product = await Product.findOne({
      subKomoditasSlug: komoditasSlug,
      statusKurasi: 'terkurasi',
    });

    if (!product) {
      throw new AppError(
        `Komoditas '${komoditasSlug}' belum memiliki produk terkurasi aktif`,
        422
      );
    }

    // Tentukan harga acuan resmi atau rata-rata
    const refPrice = await ReferencePrice.findOne({ komoditasSlug });
    let hargaAcuan = refPrice?.harga;
    let hargaAcuanSumber = 'referensi_dinas';

    if (!hargaAcuan) {
      const avgResult = await Product.aggregate([
        { $match: { subKomoditasSlug: komoditasSlug, statusKurasi: 'terkurasi' } },
        { $group: { _id: null, avg: { $avg: '$hargaAcuan' } } },
      ]);
      const avg = avgResult[0]?.avg || product.hargaAcuan;
      hargaAcuan = Math.round(avg / 500) * 500;
      hargaAcuanSumber = 'rata_rata_produk';
    }

    const kode = await generateCode('RFQ');

    const rfq = await RFQ.create({
      kode,
      mitraUserId,
      komoditasSlug,
      komoditasNama: product.subKomoditas,
      kategori: product.kategori,
      satuan: product.satuan,
      kuotaTotal,
      kuotaTerkumpul: 0,
      hargaAcuan,
      hargaAcuanSumber,
      tenggat: targetDate,
      lokasiKirim,
      catatanMutu,
      status: 'draf',
      riwayat: [
        {
          at: new Date(),
          oleh: mitraUserId,
          aksi: 'DRAF_DIBUAT',
          dariStatus: null,
          keStatus: 'draf',
          catatan: 'Draf RFQ baru disimpan',
        },
      ],
    });

    await auditLog.write({
      userId: mitraUserId,
      action: 'RFQ_DRAFT_CREATED',
      resource: 'RFQ',
      resourceId: rfq._id,
      details: { kode, komoditasSlug, kuotaTotal },
    });

    return rfq;
  },

  /**
   * Detail RFQ dengan kontrol wewenang per peran
   */
  async getById(id, user) {
    const rfq = await RFQ.findById(id).populate('mitraUserId', 'nama email noHp mitraId');
    if (!rfq) {
      throw new AppError('Dokumen RFQ tidak ditemukan', 404);
    }

    // Cek kedaluwarsa secara lazy
    if (rfq.status === 'terbuka' && new Date(rfq.tenggat) < new Date()) {
      rfq.status = 'kedaluwarsa';
      rfq.riwayat.push({
        at: new Date(),
        aksi: 'KEDALUWARSA_OTOMATIS',
        dariStatus: 'terbuka',
        keStatus: 'kedaluwarsa',
        catatan: 'Tenggat waktu pengisian kuota telah lewat',
      });
      await rfq.save();
      // Batalkan semua alokasi aktif
      await RFQAllocation.updateMany(
        { rfqId: rfq._id, status: 'proses_verifikasi' },
        {
          status: 'dibatalkan',
          alasanBatal: 'RFQ kedaluwarsa melewati batas tenggat waktu',
          dibatalkanAt: new Date(),
        }
      );
    }

    // Role Mitra: hanya boleh melihat miliknya
    if (user.role === ROLES.MITRA && String(rfq.mitraUserId._id || rfq.mitraUserId) !== String(user.id)) {
      throw new AppError('Anda tidak memiliki akses ke RFQ ini', 403);
    }

    // Role UMKM: hanya boleh melihat jika akun aktif dan punya produk cocok
    if (user.role === ROLES.UMKM) {
      const profile = await BusinessProfile.findOne({ userId: user.id });
      if (!profile) {
        throw new AppError('Profil usaha tidak ditemukan', 403);
      }
      const hasProduct = await Product.exists({
        businessId: profile._id,
        subKomoditasSlug: rfq.komoditasSlug,
        statusKurasi: 'terkurasi',
      });
      if (!hasProduct && rfq.status !== 'terpenuhi') {
        throw new AppError(
          'Hanya UMKM dengan produk terkurasi yang sesuai yang dapat melihat detail RFQ ini',
          403
        );
      }
    }

    return rfq;
  },

  /**
   * AC-07-10: Update Draf RFQ
   */
  async update(id, mitraUserId, data) {
    const rfq = await RFQ.findById(id);
    if (!rfq) throw new AppError('RFQ tidak ditemukan', 404);

    if (String(rfq.mitraUserId) !== String(mitraUserId)) {
      throw new AppError('Anda bukan pemilik RFQ ini', 403);
    }

    if (!['draf', 'ditolak'].includes(rfq.status)) {
      throw new AppError(
        `RFQ dengan status '${rfq.status}' tidak dapat diubah`,
        409
      );
    }

    if (data.tenggat) {
      const targetDate = new Date(data.tenggat);
      const minDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const maxDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
      if (targetDate < minDate || targetDate > maxDate) {
        throw new AppError(
          'Tenggat harus minimal 7 hari dan maksimal 90 hari dari hari ini',
          422
        );
      }
      rfq.tenggat = targetDate;
    }

    if (data.kuotaTotal) rfq.kuotaTotal = data.kuotaTotal;
    if (data.lokasiKirim) rfq.lokasiKirim = data.lokasiKirim;
    if (data.catatanMutu !== undefined) rfq.catatanMutu = data.catatanMutu;

    rfq.riwayat.push({
      at: new Date(),
      oleh: mitraUserId,
      aksi: 'RFQ_DIPERBARUI',
      dariStatus: rfq.status,
      keStatus: rfq.status,
      catatan: 'Penyuntingan draf RFQ oleh mitra',
    });

    await rfq.save();
    return rfq;
  },

  /**
   * AC-07-10: Hapus Draf RFQ
   */
  async delete(id, mitraUserId) {
    const rfq = await RFQ.findById(id);
    if (!rfq) throw new AppError('RFQ tidak ditemukan', 404);

    if (String(rfq.mitraUserId) !== String(mitraUserId)) {
      throw new AppError('Anda bukan pemilik RFQ ini', 403);
    }

    if (rfq.status !== 'draf') {
      throw new AppError('Hanya RFQ berstatus draf yang dapat dihapus', 409);
    }

    await RFQ.findByIdAndDelete(id);
    return { id, message: 'Draf RFQ berhasil dihapus' };
  },

  /**
   * AC-07-08: Ajukan RFQ untuk Verifikasi Dinas
   */
  async submitForVerification(id, mitraUserId) {
    const rfq = await RFQ.findById(id);
    if (!rfq) throw new AppError('RFQ tidak ditemukan', 404);

    if (String(rfq.mitraUserId) !== String(mitraUserId)) {
      throw new AppError('Anda bukan pemilik RFQ ini', 403);
    }

    if (!['draf', 'ditolak'].includes(rfq.status)) {
      throw new AppError(
        `RFQ berstatus '${rfq.status}' tidak dapat diajukan untuk verifikasi`,
        409
      );
    }

    const dari = rfq.status;
    rfq.status = 'menunggu_verifikasi';
    rfq.riwayat.push({
      at: new Date(),
      oleh: mitraUserId,
      aksi: 'PENGAJUAN_VERIFIKASI',
      dariStatus: dari,
      keStatus: 'menunggu_verifikasi',
      catatan: 'Mitra mengajukan RFQ untuk verifikasi oleh dinas',
    });

    await rfq.save();

    await auditLog.write({
      userId: mitraUserId,
      action: 'RFQ_SUBMITTED_FOR_VERIFICATION',
      resource: 'RFQ',
      resourceId: rfq._id,
      details: { kode: rfq.kode },
    });

    return rfq;
  },

  /**
   * AC-07-11: Batalkan RFQ
   */
  async cancel(id, mitraUserId, alasan) {
    const rfq = await RFQ.findById(id);
    if (!rfq) throw new AppError('RFQ tidak ditemukan', 404);

    if (String(rfq.mitraUserId) !== String(mitraUserId)) {
      throw new AppError('Anda bukan pemilik RFQ ini', 403);
    }

    if (!['menunggu_verifikasi', 'terbuka'].includes(rfq.status)) {
      throw new AppError(
        `RFQ dengan status '${rfq.status}' tidak dapat dibatalkan oleh mitra`,
        409
      );
    }

    const dari = rfq.status;
    rfq.status = 'dibatalkan';
    rfq.riwayat.push({
      at: new Date(),
      oleh: mitraUserId,
      aksi: 'DIBATALKAN_MITRA',
      dariStatus: dari,
      keStatus: 'dibatalkan',
      catatan: alasan || 'Mitra membatalkan pesanan',
    });

    await rfq.save();

    // Jika RFQ sebelumnya terbuka, batalkan seluruh alokasi yang ada
    await RFQAllocation.updateMany(
      { rfqId: id, status: 'proses_verifikasi' },
      {
        status: 'dibatalkan',
        alasanBatal: alasan || 'RFQ dibatalkan oleh pemesan (mitra)',
        dibatalkanOleh: mitraUserId,
        dibatalkanAt: new Date(),
      }
    );

    await auditLog.write({
      userId: mitraUserId,
      action: 'RFQ_CANCELLED_BY_MITRA',
      resource: 'RFQ',
      resourceId: rfq._id,
      details: { alasan },
    });

    return rfq;
  },

  /**
   * AC-10-01: RFQ Terbuka yang cocok dengan produk terkurasi UMKM
   */
  async getOpenRfqsForUmkm(userId) {
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile) {
      return { cocok: false, rfqs: [], message: 'Profil usaha belum dilengkapi' };
    }

    const products = await Product.find({
      businessId: profile._id,
      statusKurasi: 'terkurasi',
    }).select('subKomoditasSlug nama kapasitasBulanan satuan');

    if (!products.length) {
      return {
        cocok: false,
        rfqs: [],
        message: 'Produk Anda belum terkurasi. Daftarkan produk ke kurasi dinas terlebih dahulu.',
      };
    }

    const validSlugs = [...new Set(products.map((p) => p.subKomoditasSlug))];

    const rfqs = await RFQ.find({
      status: 'terbuka',
      tenggat: { $gt: new Date() },
      komoditasSlug: { $in: validSlugs },
    })
      .sort({ tenggat: 1 })
      .populate('mitraUserId', 'nama email');

    // Cek apakah UMKM sudah memiliki komitmen alokasi aktif di RFQ ini
    const rfqsWithMyAllocation = await Promise.all(
      rfqs.map(async (rfqDoc) => {
        const myAlloc = await RFQAllocation.findOne({
          rfqId: rfqDoc._id,
          businessId: profile._id,
          status: { $in: ['proses_verifikasi', 'terkonfirmasi'] },
        });

        const rfqObj = rfqDoc.toObject();
        rfqObj.alokasiSaya = myAlloc;
        rfqObj.sisaKuota = Math.max(0, rfqDoc.kuotaTotal - rfqDoc.kuotaTerkumpul);
        rfqObj.persentaseTerkumpul = Math.round(
          (rfqDoc.kuotaTerkumpul / rfqDoc.kuotaTotal) * 100
        );

        return rfqObj;
      })
    );

    return {
      cocok: true,
      produkSaya: products,
      rfqs: rfqsWithMyAllocation,
    };
  },
};

export default rfqService;
