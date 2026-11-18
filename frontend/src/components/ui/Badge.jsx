import React from 'react';

const VARIANTS = {
  aktif: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  valid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  terkurasi: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  menunggu_persetujuan: 'bg-amber-50 text-amber-700 border-amber-200',
  menunggu_verifikasi: 'bg-amber-50 text-amber-700 border-amber-200',
  dalam_pemeriksaan: 'bg-blue-50 text-blue-700 border-blue-200',
  menunggu_approval: 'bg-purple-50 text-purple-700 border-purple-200',
  perlu_revisi: 'bg-orange-50 text-orange-700 border-orange-200',
  ditolak: 'bg-rose-50 text-rose-700 border-rose-200',
  tidak_valid: 'bg-rose-50 text-rose-700 border-rose-200',
  nonaktif: 'bg-slate-100 text-slate-600 border-slate-200',
  draf: 'bg-slate-100 text-slate-600 border-slate-200',
  grade_a: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold',
  grade_b: 'bg-slate-700 text-white font-semibold',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

const LABELS = {
  menunggu_persetujuan: 'Menunggu Persetujuan',
  menunggu_verifikasi: 'Menunggu Verifikasi',
  dalam_pemeriksaan: 'Dalam Pemeriksaan',
  menunggu_approval: 'Menunggu Approval Kabid',
  perlu_revisi: 'Perlu Revisi',
  terkurasi: 'Terkurasi Dinas',
  valid: 'Valid',
  tidak_valid: 'Tidak Valid',
  belum_diperiksa: 'Belum Diperiksa',
  aktif: 'Aktif',
  ditolak: 'Ditolak',
  nonaktif: 'Nonaktif',
  draf: 'Draf',
};

export function Badge({ status, label, variant, size = 'sm', className = '' }) {
  const resolvedVariant = variant || VARIANTS[status] || VARIANTS.default;
  const resolvedLabel = label || LABELS[status] || status;
  const sizeClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${resolvedVariant} ${sizeClass} ${className}`}
    >
      {resolvedLabel}
    </span>
  );
}
