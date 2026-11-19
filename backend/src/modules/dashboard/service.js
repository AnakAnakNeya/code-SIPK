// ============================================================================
// [PBI-15] Service Dashboard (backend/src/modules/dashboard/service.js)
// PIC: Naila | Metrik Eksekutif Dinas Koperasi & UKM dan Dasbor UMKM Binaan
// ============================================================================

import User from '../../models/User.js';
import Product from '../../models/Product.js';
import RFQ from '../../models/RFQ.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import KurasiSubmission from '../../models/KurasiSubmission.js';
import SintesaRequest from '../../models/SintesaRequest.js';
import Event from '../../models/Event.js';
import EventRegistration from '../../models/EventRegistration.js';
import ForumThread from '../../models/ForumThread.js';
import { KECAMATAN } from '../../constants/kecamatan.js';

// Cache in-memory 60 detik (AC-15-12)
const cache = new Map();
const CACHE_TTL = 60 * 1000;

export const dashboardService = {
  /**
   * AC-15-01 s/d AC-15-05: Dasbor Analitik Eksekutif Dinas
   */
  async getDinasKpi(periode = '30d') {
    const cacheKey = `dinas:${periode}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return cached.data;
    }

    // Filter Periode
    const now = new Date();
    let startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    if (periode === '90d') {
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (periode === 'tahun') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // 4 Kartu KPI Utama (AC-15-01)
    const [
      umkmTerdaftar,
      produkLolosKurasi,
      rfqTerpenuhi,
      antreanSintesa,
    ] = await Promise.all([
      User.countDocuments({ role: 'umkm', status: 'aktif' }),
      Product.countDocuments({ statusKurasi: 'terkurasi' }),
      RFQ.countDocuments({ status: 'terpenuhi', terpenuhiAt: { $gte: startDate } }),
      SintesaRequest.countDocuments({
        status: { $in: ['diajukan', 'dijadwalkan', 'desain_dikerjakan'] },
      }),
    ]);

    // Antrean Hari Ini (AC-15-03)
    const [
      akunMenunggu,
      kurasiMenungguVerifikasi,
      kurasiMenungguApproval,
      rfqMenungguVerifikasi,
      rfqKuotaPenuh,
    ] = await Promise.all([
      User.countDocuments({ status: 'menunggu_persetujuan' }),
      KurasiSubmission.countDocuments({ status: 'menunggu_verifikasi' }),
      KurasiSubmission.countDocuments({ status: 'menunggu_approval' }),
      RFQ.countDocuments({ status: 'menunggu_verifikasi' }),
      RFQ.countDocuments({ status: 'proses_verifikasi' }),
    ]);

    // Sebaran UMKM per 28 Kecamatan (AC-15-02)
    const kecamatanAgg = await BusinessProfile.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'u',
        },
      },
      { $unwind: '$u' },
      { $match: { 'u.status': 'aktif' } },
      {
        $group: {
          _id: '$kecamatan',
          total: { $sum: 1 },
        },
      },
    ]);

    const sebaranMap = Object.fromEntries(kecamatanAgg.map((item) => [item._id, item.total]));
    const sebaranKecamatan = KECAMATAN.map((kec) => ({
      kecamatan: kec,
      aktif: sebaranMap[kec] || 0,
    })).sort((a, b) => b.aktif - a.aktif);

    // Agenda 3 Event Terdekat (AC-15-04)
    const agendaEvent = await Event.find({ status: 'dibuka', tanggalMulai: { $gte: now } })
      .sort({ tanggalMulai: 1 })
      .limit(3)
      .select('nama jenis lokasi tanggalMulai kuota terisi');

    // Forum 3 Thread Terbaru + Pinned (AC-15-05)
    const forumTerbaru = await ForumThread.find({ status: 'aktif' })
      .sort({ pinned: -1, lastActivityAt: -1 })
      .limit(4)
      .select('judul kategori authorNama authorKecamatan pinned terjawabDinas replyCount lastActivityAt');

    const result = {
      kpi: {
        umkmTerdaftar,
        produkLolosKurasi,
        rfqTerpenuhi,
        antreanSintesa,
      },
      antreanHariIni: {
        akunMenunggu,
        kurasiMenungguVerifikasi,
        kurasiMenungguApproval,
        rfqMenungguVerifikasi,
        rfqKuotaPenuh,
      },
      sebaranKecamatan,
      agendaEvent,
      forumTerbaru,
    };

    cache.set(cacheKey, { time: Date.now(), data: result });
    return result;
  },

  /**
   * AC-15-08 & AC-15-09: Dasbor Personalisasi Pelaku UMKM
   */
  async getUmkmSummary(userId) {
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile) return null;

    const businessId = profile._id;

    // Status Produk Saya
    const [produkDraf, produkMenunggu, produkTerkurasi] = await Promise.all([
      Product.countDocuments({ businessId, statusKurasi: 'draf' }),
      Product.countDocuments({ businessId, statusKurasi: 'menunggu_verifikasi' }),
      Product.countDocuments({ businessId, statusKurasi: 'terkurasi' }),
    ]);

    // Ambil komoditas terkurasi UMKM untuk mencocokkan RFQ terbuka
    const myCurated = await Product.find({ businessId, statusKurasi: 'terkurasi' }).select(
      'subKomoditasSlug'
    );
    const slugs = [...new Set(myCurated.map((p) => p.subKomoditasSlug))];

    const rfqCocokCount = slugs.length
      ? await RFQ.countDocuments({
          status: 'terbuka',
          komoditasSlug: { $in: slugs },
          tenggat: { $gt: new Date() },
        })
      : 0;

    // Jadwal Sintesa terdekat
    const sintesaAktif = await SintesaRequest.findOne({
      businessId,
      status: { $in: ['diajukan', 'dijadwalkan', 'desain_dikerjakan'] },
    }).sort({ createdAt: -1 });

    // Event yang diikuti
    const eventDiikutiCount = await EventRegistration.countDocuments({
      businessId,
      status: { $in: ['menunggu_verifikasi', 'disetujui'] },
    });

    // 5 Pengajuan Terakhir
    const kurasiTerakhir = await KurasiSubmission.find({ businessId })
      .populate('productId', 'nama')
      .sort({ createdAt: -1 })
      .limit(3);

    return {
      profil: {
        namaUsaha: profile.namaUsaha,
        kecamatan: profile.kecamatan,
        nib: profile.nib,
        kategoriUtama: profile.kategoriUtama,
      },
      produk: {
        draf: produkDraf,
        menunggu: produkMenunggu,
        terkurasi: produkTerkurasi,
        total: produkDraf + produkMenunggu + produkTerkurasi,
      },
      rfqCocokCount,
      sintesaAktif,
      eventDiikutiCount,
      pengajuanTerakhir: kurasiTerakhir,
    };
  },
};

export default dashboardService;
