import { z } from 'zod';
import { KATEGORI } from '../../constants/enums.js';
import { KECAMATAN } from '../../constants/kecamatan.js';

// ---------------------------------------------------------------------------
// Aturan input bersama (dipakai registrasi, profil, pendaftaran manual, reset sandi)
// ---------------------------------------------------------------------------

/** Rapikan nomor HP: buang spasi/tanda hubung/titik/kurung, ubah +62 / 62 menjadi 0. */
export function normalizePhone(value) {
  if (typeof value !== 'string') return value;
  let v = value.replace(/[\s().-]/g, '');
  if (v.startsWith('+62')) v = `0${v.slice(3)}`;
  else if (v.startsWith('62')) v = `0${v.slice(2)}`;
  return v;
}

/** HP seluler Indonesia: hanya angka, diawali 08, total 10 sampai 13 digit. */
export const noHp = z.preprocess(
  normalizePhone,
  z
    .string({ required_error: 'Nomor HP wajib diisi' })
    .regex(/^\d+$/, 'Nomor HP hanya boleh berisi angka')
    .regex(/^08/, 'Nomor HP harus diawali 08 (atau +62 8)')
    .min(10, 'Nomor HP minimal 10 digit')
    .max(13, 'Nomor HP maksimal 13 digit'),
);

/** Nama orang: huruf, spasi, titik, apostrof, tanda hubung; tanpa angka/simbol lain. */
export const namaOrang = z
  .string({ required_error: 'Nama wajib diisi' })
  .trim()
  .min(3, 'Nama minimal 3 karakter')
  .max(100, 'Nama maksimal 100 karakter')
  .regex(/^[\p{L}][\p{L}\s.'-]*$/u, 'Nama hanya boleh berisi huruf, spasi, titik, apostrof, dan tanda hubung');

export const emailRule = z
  .string({ required_error: 'Email wajib diisi' })
  .trim()
  .toLowerCase()
  .max(254, 'Email maksimal 254 karakter')
  .email('Format email tidak valid');

/** Kata sandi baru: 8-64 karakter, huruf besar, huruf kecil, angka, simbol, tanpa spasi. */
export const passwordRule = z
  .string({ required_error: 'Kata sandi wajib diisi' })
  .min(8, 'Kata sandi minimal 8 karakter')
  .max(64, 'Kata sandi maksimal 64 karakter')
  .regex(/[a-z]/, 'Kata sandi harus mengandung huruf kecil')
  .regex(/[A-Z]/, 'Kata sandi harus mengandung huruf besar')
  .regex(/\d/, 'Kata sandi harus mengandung angka')
  .regex(/[^A-Za-z0-9\s]/, 'Kata sandi harus mengandung simbol (contoh: ! @ # $ %)')
  .regex(/^\S+$/, 'Kata sandi tidak boleh mengandung spasi');

export const nib = z
  .string({ required_error: 'NIB wajib diisi' })
  .trim()
  .regex(/^\d{13}$/, 'NIB harus 13 digit angka');
const profilFields = {
  namaUsaha: z.string().trim().min(3, 'Nama usaha minimal 3 karakter').max(120),
  kecamatan: z.enum(KECAMATAN, { errorMap: () => ({ message: 'Pilih kecamatan di Kabupaten Lebak' }) }),
  tahunMulai: z.coerce
    .number({ invalid_type_error: 'Tahun mulai harus berupa angka' })
    .int('Tahun mulai harus bilangan bulat')
    .min(1950, 'Tahun mulai minimal 1950')
    .max(new Date().getFullYear(), 'Tahun mulai tidak boleh melebihi tahun ini'),
  alamat: z.string().trim().min(10, 'Alamat minimal 10 karakter').max(300),
  waUsaha: noHp,
  kategoriUtama: z.enum(Object.values(KATEGORI), {
    errorMap: () => ({ message: 'Pilih kategori kriya tenun atau olahan pangan' }),
  }),
  subKomoditas: z
    .array(z.string().trim().min(2, 'Sub-komoditas minimal 2 karakter').max(40))
    .min(1, 'Isi minimal 1 sub-komoditas')
    .max(5, 'Maksimal 5 sub-komoditas'),
};

export const registerSchema = z
  .object({
    // langkah 1
    nama: namaOrang,
    email: emailRule,
    noHp,
    password: passwordRule,
    konfirmasiPassword: z.string().optional(),
    // langkah 2 + 3
    ...profilFields,
    nib,
    pernyataanBenar: z.literal(true, {
      errorMap: () => ({ message: 'Pernyataan kebenaran data wajib dicentang' }),
    }),
  })
  .refine((v) => v.konfirmasiPassword === undefined || v.konfirmasiPassword === v.password, {
    path: ['konfirmasiPassword'],
    message: 'Konfirmasi kata sandi tidak sama',
  });

export const loginSchema = z.object({
  identifier: z.string({ required_error: 'Email atau NIB wajib diisi' }).trim().min(1, 'Email atau NIB wajib diisi'),
  password: z.string({ required_error: 'Kata sandi wajib diisi' }).min(1, 'Kata sandi wajib diisi').max(128, 'Kata sandi terlalu panjang'),
  remember: z.boolean().optional().default(false),
});

export const forgotSchema = z.object({
  email: emailRule,
});

export const resetSchema = z.object({
  token: z.string().min(10, 'Token tidak valid'),
  password: passwordRule,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi').max(128),
  newPassword: passwordRule,
});

// NIB tidak ada di sini: hanya dinas yang boleh mengubah NIB (AC-01-16). Field lain di-strip.
export const updateProfilSchema = z.object(profilFields).partial();
