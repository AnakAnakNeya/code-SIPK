// ============================================================================
// [PBI-14] Service Sintesa (backend/src/modules/sintesa/service.js)
// PIC: Fariz | Layanan Rumah Kemasan Gratis Sintesa Dinkop UKM Lebak
// ============================================================================

import SintesaRequest from '../../models/SintesaRequest.js';
import SintesaQuota from '../../models/SintesaQuota.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import Product from '../../models/Product.js';
import LegalDocument from '../../models/LegalDocument.js';
import { generateCode } from '../../utils/codeGenerator.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import { ROLES } from '../../constants/roles.js';

export const sintesaService = {
  /**
   * AC-14-04: Kuota Subsidi Cetak Kemasan Tahun Berjalan
   */
  async getQuota() {
    const tahun = new Date().getFullYear();
    let q = await SintesaQuota.findOne({ tahun });
    if (!q) {
      q = await SintesaQuota.create({ tahun, total: 100, terpakai: 0 });
    }
    return {
      tahun: q.tahun,
      total: q.total,
      terpakai: q.terpakai,
      sisa: Math.max(0, q.total - q.terpakai),
    };
  },

  /**
   * AC-14-01 & AC-14-03: Cek Kelayakan & Daftar Produk Memenuhi Syarat
   */
  async checkEligibility(userId) {
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile) {
      return { eligible: false, message: 'Profil usaha belum dilengkapi', products: [] };
    }

    // 1. Cek NIB Valid
    const hasValidNib = await LegalDocument.exists({
      businessId: profile._id,
      jenis: 'nib',
      $or: [{ statusVerifikasi: 'valid' }, { status: 'valid' }],
    });

    // 2. Cek Batas 1 Pengajuan Per Tahun
    const tahun = new Date().getFullYear();
    const alreadyAppliedThisYear = await SintesaRequest.exists({
      businessId: profile._id,
      tahun,
      status: { $nin: ['ditolak', 'dibatalkan'] },
    });

    // 3. Ambil Produk Terkurasi
    const curatedProducts = await Product.find({
      businessId: profile._id,
      statusKurasi: 'terkurasi',
    }).select('nama kategori subKomoditas satuan gradeKurasi');

    const eligible = hasValidNib && !alreadyAppliedThisYear && curatedProducts.length > 0;

    return {
      eligible,
      hasValidNib: Boolean(hasValidNib),
      alreadyAppliedThisYear: Boolean(alreadyAppliedThisYear),
      curatedProductsCount: curatedProducts.length,
      products: curatedProducts,
      message: !hasValidNib
        ? 'Dokumen NIB belum berstatus valid dari dinas'
        : alreadyAppliedThisYear
        ? 'Anda sudah memanfaatkan kuota fasilitasi Sintesa untuk tahun ini'
        : curatedProducts.length === 0
        ? 'Belum ada produk yang lulus kurasi resmi dinas'
        : 'Usaha Anda memenuhi syarat fasilitasi Rumah Kemasan Sintesa',
    };
  },

  /**
   * AC-14-02: Pengajuan Layanan Desain Kemasan Baru
   */
  async createRequest({ businessId, productId, jenisFasilitasi, kondisiKemasan, targetPasar, fotoKemasan = [], usulanJadwal, userId }) {
    const eligibility = await this.checkEligibility(userId);
    if (!eligibility.eligible) {
      throw new AppError(eligibility.message, 422);
    }

    const product = await Product.findOne({ _id: productId, businessId, statusKurasi: 'terkurasi' });
    if (!product) {
      throw new AppError('Produk yang dipilih belum lulus kurasi resmi', 422);
    }

    const tglUsulan = new Date(usulanJadwal);
    const minDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    if (tglUsulan < minDate) {
      throw new AppError('Usulan jadwal konsultasi minimal 3 hari kerja ke depan', 422);
    }

    const tahun = new Date().getFullYear();
    const kode = await generateCode('SIN');

    const reqDoc = await SintesaRequest.create({
      kode,
      businessId,
      productId,
      tahun,
      jenisFasilitasi,
      kondisiKemasan,
      targetPasar,
      fotoKemasan,
      usulanJadwal: tglUsulan,
      status: 'diajukan',
      timeline: [
        {
          at: new Date(),
          oleh: userId,
          status: 'diajukan',
          catatan: 'Pengajuan fasilitasi kemasan baru dikirimkan oleh UMKM',
        },
      ],
    });

    await auditLog.write({
      userId,
      action: 'SINTESA_REQUEST_CREATED',
      resource: 'SintesaRequest',
      resourceId: reqDoc._id,
      details: { kode, jenisFasilitasi },
    });

    return reqDoc;
  },

  async getMyRequests(userId) {
    const profile = await BusinessProfile.findOne({ userId });
    if (!profile) return [];

    return SintesaRequest.find({ businessId: profile._id })
      .populate('productId', 'nama kategori subKomoditas satuan gradeKurasi')
      .sort({ createdAt: -1 });
  },

  async getById(id, user) {
    const doc = await SintesaRequest.findById(id)
      .populate('businessId', 'namaUsaha kecamatan namaPemilik waUsaha')
      .populate('productId', 'nama kategori satuan gradeKurasi');

    if (!doc) throw new AppError('Dokumen pengajuan Sintesa tidak ditemukan', 404);

    if (user.role === ROLES.UMKM) {
      const profile = await BusinessProfile.findOne({ userId: user.id });
      if (String(doc.businessId._id || doc.businessId) !== String(profile?._id)) {
        throw new AppError('Anda bukan pemilik pengajuan ini', 403);
      }
    }

    return doc;
  },

  async cancelRequest(id, userId) {
    const doc = await SintesaRequest.findById(id);
    if (!doc) throw new AppError('Dokumen tidak ditemukan', 404);

    if (!['diajukan', 'dijadwalkan'].includes(doc.status)) {
      throw new AppError(`Pengajuan dengan status '${doc.status}' tidak dapat dibatalkan`, 409);
    }

    doc.status = 'dibatalkan';
    doc.timeline.push({
      at: new Date(),
      oleh: userId,
      status: 'dibatalkan',
      catatan: 'Dibatalkan mandiri oleh Pelaku UMKM',
    });
    await doc.save();

    return doc;
  },

  async listAll({ status }) {
    const filter = {};
    if (status) filter.status = status;

    return SintesaRequest.find(filter)
      .populate('businessId', 'namaUsaha kecamatan namaPemilik waUsaha')
      .populate('productId', 'nama kategori satuan')
      .sort({ createdAt: -1 });
  },

  async setSchedule(id, { jadwalFinal }, stafId) {
    const doc = await SintesaRequest.findById(id);
    if (!doc) throw new AppError('Dokumen tidak ditemukan', 404);

    doc.status = 'dijadwalkan';
    doc.jadwalFinal = new Date(jadwalFinal);
    doc.timeline.push({
      at: new Date(),
      oleh: stafId,
      status: 'dijadwalkan',
      catatan: `Jadwal konsultasi tatap muka ditetapkan pada ${new Date(jadwalFinal).toLocaleString('id-ID')}`,
    });
    await doc.save();

    await auditLog.write({
      userId: stafId,
      action: 'SINTESA_SCHEDULED',
      resource: 'SintesaRequest',
      resourceId: doc._id,
      details: { kode: doc.kode, jadwalFinal },
    });

    return doc;
  },

  /**
   * AC-14-08: Penetapan Desainer & Pemotongan Kuota Subsidi Cetak Atomik
   */
  async setDesigner(id, { desainerNama }, stafId) {
    const doc = await SintesaRequest.findById(id);
    if (!doc) throw new AppError('Dokumen tidak ditemukan', 404);

    const tahun = doc.tahun || new Date().getFullYear();

    // POTONG KUOTA SUBSIDI CETAK ATOMIK
    const q = await SintesaQuota.findOneAndUpdate(
      { tahun, $expr: { $lt: ['$terpakai', '$total'] } },
      { $inc: { terpakai: 1 } },
      { new: true }
    );

    if (!q) {
      throw new AppError('Kuota subsidi cetak kemasan dinas tahun ini sudah habis', 409);
    }

    doc.status = 'desain_dikerjakan';
    doc.desainerNama = desainerNama;
    doc.timeline.push({
      at: new Date(),
      oleh: stafId,
      status: 'desain_dikerjakan',
      catatan: `Proses desain kemasan ditugaskan kepada desainer Rumah Kemasan: ${desainerNama}`,
    });
    await doc.save();

    await auditLog.write({
      userId: stafId,
      action: 'SINTESA_DESIGN_ASSIGNED',
      resource: 'SintesaRequest',
      resourceId: doc._id,
      details: { kode: doc.kode, desainerNama },
    });

    return doc;
  },

  async completeRequest(id, { catatanHasil }, stafId) {
    const doc = await SintesaRequest.findById(id);
    if (!doc) throw new AppError('Dokumen tidak ditemukan', 404);

    doc.status = 'selesai';
    doc.catatanHasil = catatanHasil || 'Desain kemasan telah disetujui (ACC cetak) oleh pelaku usaha';
    doc.timeline.push({
      at: new Date(),
      oleh: stafId,
      status: 'selesai',
      catatan: doc.catatanHasil,
    });
    await doc.save();

    await auditLog.write({
      userId: stafId,
      action: 'SINTESA_COMPLETED',
      resource: 'SintesaRequest',
      resourceId: doc._id,
      details: { kode: doc.kode },
    });

    return doc;
  },

  async rejectRequest(id, { alasan }, stafId) {
    const doc = await SintesaRequest.findById(id);
    if (!doc) throw new AppError('Dokumen tidak ditemukan', 404);

    doc.status = 'ditolak';
    doc.alasanTolak = alasan || 'Tidak memenuhi kriteria fasilitasi';
    doc.timeline.push({
      at: new Date(),
      oleh: stafId,
      status: 'ditolak',
      catatan: doc.alasanTolak,
    });
    await doc.save();

    await auditLog.write({
      userId: stafId,
      action: 'SINTESA_REJECTED',
      resource: 'SintesaRequest',
      resourceId: doc._id,
      details: { kode: doc.kode, alasan },
    });

    return doc;
  },
};

export default sintesaService;
