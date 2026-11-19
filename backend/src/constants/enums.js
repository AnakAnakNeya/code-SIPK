// Kontrak bersama tim (PRD Sprint 1 & 2). Jangan diubah tanpa kabar ke tim.

export const ROLES = { UMKM: 'umkm', STAF: 'staf', KABID: 'kabid', MITRA: 'mitra' };

export const STATUS_AKUN = ['menunggu_persetujuan', 'aktif', 'ditolak', 'nonaktif'];

export const KATEGORI = { KRIYA: 'kriya_tenun', PANGAN: 'olahan_pangan' };

export const JENIS_DOKUMEN = ['nib', 'spp_irt', 'halal', 'uji_umur_simpan', 'hak_merek'];
export const STATUS_DOKUMEN = ['belum_diperiksa', 'valid', 'perlu_revisi', 'tidak_valid'];

export const STATUS_PRODUK = ['draf', 'menunggu_verifikasi', 'perlu_revisi', 'terkurasi'];
export const GRADE = ['A', 'B'];

export const STATUS_KURASI = [
  'menunggu_verifikasi', // baru diajukan UMKM, belum diambil staf
  'dalam_pemeriksaan', // sedang diperiksa staf
  'menunggu_approval', // staf merekomendasikan setuju, menunggu kabid
  'perlu_revisi', // dikembalikan ke UMKM
  'disetujui', // kabid menyetujui
];

// [Sprint 2 / PBI-07 s/d PBI-11]
export const STATUS_RFQ = [
  'draf',
  'menunggu_verifikasi',
  'ditolak',
  'terbuka',
  'proses_verifikasi',
  'terpenuhi',
  'kedaluwarsa',
  'dibatalkan',
];

export const STATUS_ALOKASI = ['proses_verifikasi', 'terkonfirmasi', 'dibatalkan'];

export const HARGA_ACUAN_SUMBER = ['referensi_dinas', 'rata_rata_produk'];
