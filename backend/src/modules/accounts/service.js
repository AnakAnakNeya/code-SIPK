// ============================================================================
// [PBI-16] Service Accounts & Audit (backend/src/modules/accounts/service.js)
// PIC: Abdullah | Manajemen Akun, Matriks Hak Akses, & Audit Trail Log
// ============================================================================

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../../models/User.js';
import RFQ from '../../models/RFQ.js';
import AuditLog from '../../models/AuditLog.js';
import { generateCode } from '../../utils/codeGenerator.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import { ROLES, STATUS_AKUN } from '../../constants/enums.js';

export const accountService = {
  /**
   * AC-16-01: Daftar Akun Pengguna
   */
  async listUsers({ role, status, q, page = 1, limit = 10 }) {
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { nama: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { noHp: { $regex: q, $options: 'i' } },
        { mitraId: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      User.find(filter)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * AC-16-02 s/d AC-16-04: Tambah Akun Staf atau Mitra Baru oleh Kabid
   */
  async createUser({ nama, email, noHp, role, instansi }, kabidId) {
    if (![ROLES.STAF, ROLES.MITRA].includes(role)) {
      throw new AppError("Pembuatan akun hanya diizinkan untuk peran 'staf' atau 'mitra'", 422);
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      throw new AppError('Email sudah terdaftar di sistem', 409);
    }

    // Generate kata sandi sementara 10 karakter acak (AC-16-03)
    const tempPassword = crypto.randomBytes(5).toString('hex') + 'A1!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    let mitraId = null;
    if (role === ROLES.MITRA) {
      mitraId = await generateCode('MTR');
    }

    const user = await User.create({
      nama,
      email: email.toLowerCase(),
      noHp,
      role,
      status: 'aktif',
      instansi: instansi || null,
      mitraId,
      passwordHash,
      mustChangePassword: true,
      createdVia: 'dinas',
      createdBy: kabidId,
    });

    await auditLog.write({
      userId: kabidId,
      action: 'USER_CREATED_BY_KABID',
      resource: 'User',
      resourceId: user._id,
      details: { email: user.email, role: user.role, mitraId },
    });

    return {
      user: {
        _id: user._id,
        nama: user.nama,
        email: user.email,
        noHp: user.noHp,
        role: user.role,
        status: user.status,
        mitraId: user.mitraId,
        mustChangePassword: user.mustChangePassword,
      },
      tempPassword, // Ditampilkan sekali kepada Kabid (AC-16-03)
    };
  },

  /**
   * AC-16-06 & AC-16-07: Ubah Status Akun (Aktif / Nonaktif)
   */
  async updateStatus(id, { status, alasan }, kabidId) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Pengguna tidak ditemukan', 404);

    // AC-16-07: Kabid tidak bisa menonaktifkan akunnya sendiri
    if (String(user._id) === String(kabidId)) {
      throw new AppError('Anda tidak dapat menonaktifkan akun Anda sendiri', 403);
    }

    // AC-16-07: Minimal 1 Kabid aktif harus tersisa
    if (user.role === ROLES.KABID && status === 'nonaktif') {
      const activeKabidCount = await User.countDocuments({
        role: ROLES.KABID,
        status: 'aktif',
      });
      if (activeKabidCount <= 1) {
        throw new AppError('Operasi ditolak: Minimal harus ada 1 pimpinan Kabid yang aktif', 409);
      }
    }

    if (status === 'nonaktif' && !alasan) {
      throw new AppError('Alasan penonaktifan akun wajib diisi', 422);
    }

    const dari = user.status;
    user.status = status;
    user.catatanStatus = alasan || null;
    await user.save();

    await auditLog.write({
      userId: kabidId,
      action: `USER_STATUS_${status.toUpperCase()}`,
      resource: 'User',
      resourceId: user._id,
      details: { email: user.email, dariStatus: dari, keStatus: status, alasan },
    });

    return user;
  },

  /**
   * AC-16-08: Reset Kata Sandi oleh Kabid
   */
  async resetPassword(id, kabidId) {
    const user = await User.findById(id);
    if (!user) throw new AppError('Pengguna tidak ditemukan', 404);

    const tempPassword = crypto.randomBytes(5).toString('hex') + 'B2!';
    user.passwordHash = await bcrypt.hash(tempPassword, 10);
    user.mustChangePassword = true;
    await user.save();

    await auditLog.write({
      userId: kabidId,
      action: 'USER_PASSWORD_RESET_BY_KABID',
      resource: 'User',
      resourceId: user._id,
      details: { email: user.email },
    });

    return { email: user.email, tempPassword };
  },

  /**
   * AC-16-09: Matriks Hak Akses Resmi Sistem
   */
  async getPermissionsMatrix() {
    return [
      { modul: 'Pendaftaran & Profil Usaha Mandiri', umkm: 'Ya', staf: 'Tidak', kabid: 'Tidak', mitra: 'Tidak' },
      { modul: 'Verifikasi Akun UMKM Baru', umkm: 'Tidak', staf: 'Ya', kabid: 'Ya (Approval Akhir)', mitra: 'Tidak' },
      { modul: 'Manajemen Produk & Pengajuan Kurasi', umkm: 'Ya', staf: 'Tidak', kabid: 'Tidak', mitra: 'Tidak' },
      { modul: 'Pemeriksaan Kurasi 4-Tahap', umkm: 'Tidak', staf: 'Pemeriksa', kabid: 'Pemeriksa & Approval SK', mitra: 'Tidak' },
      { modul: 'Pembuatan Permintaan Pesanan (RFQ)', umkm: 'Tidak', staf: 'Tidak', kabid: 'Tidak', mitra: 'Ya' },
      { modul: 'Pengambilan Kuota Pasokan Kolektif', umkm: 'Ya (Terkurasi)', staf: 'Tidak', kabid: 'Tidak', mitra: 'Tidak' },
      { modul: 'Verifikasi RFQ & Pengesahan PO PDF', umkm: 'Tidak', staf: 'Ya', kabid: 'Ya', mitra: 'Tidak' },
      { modul: 'Pendaftaran Stan Event Pameran', umkm: 'Ya', staf: 'Tidak', kabid: 'Tidak', mitra: 'Tidak' },
      { modul: 'Layanan Rumah Kemasan Sintesa', umkm: 'Ya (1x/Tahun)', staf: 'Kelola Jadwal/Desain', kabid: 'Kelola', mitra: 'Tidak' },
      { modul: 'Forum Komunitas & Tanya Jawab', umkm: 'Tanya/Diskusi', staf: 'Jawaban Resmi', kabid: 'Jawaban Resmi & Sematan', mitra: 'Tidak' },
      { modul: 'Manajemen Akun Staf/Mitra & Audit Log', umkm: 'Tidak', staf: 'Tidak', kabid: 'Penuh (Khusus Kabid)', mitra: 'Tidak' },
    ];
  },

  /**
   * AC-16-10: Riwayat Audit Trail
   */
  async getAuditLogs({ dari, sampai, actorId, aksi, page = 1, limit = 20 }) {
    const filter = {};
    if (actorId) filter.actorId = actorId;
    if (aksi) filter.action = aksi;
    if (dari || sampai) {
      filter.createdAt = {};
      if (dari) filter.createdAt.$gte = new Date(dari);
      if (sampai) filter.createdAt.$lte = new Date(sampai);
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      AuditLog.find(filter)
        .populate('actorId', 'nama email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },
};

export default accountService;
