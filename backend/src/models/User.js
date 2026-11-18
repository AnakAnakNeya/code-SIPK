// ============================================================================
// [PBI-01] Model Pengguna & Role-Based Access Control (User Schema)
// ============================================================================
import mongoose from 'mongoose';
import { ROLES, STATUS_AKUN } from '../constants/enums.js';

const userSchema = new mongoose.Schema(
  {
    nama: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    noHp: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), required: true },
    status: { type: String, enum: STATUS_AKUN, default: 'menunggu_persetujuan' },
    catatanStatus: String, // alasan ditolak/nonaktif
    mustChangePassword: { type: Boolean, default: false },
    mitraId: String, // 'MTR-2026-0089', khusus role mitra
    createdVia: { type: String, enum: ['mandiri', 'dinas', 'seed'], default: 'mandiri' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resetTokenHash: { type: String, select: false },
    resetExpires: { type: Date, select: false },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
