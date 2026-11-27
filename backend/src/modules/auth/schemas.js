import { z } from 'zod';
import { KATEGORI } from '../../constants/enums.js';
import { KECAMATAN } from '../../constants/kecamatan.js';

export const noHp = z.string().trim().regex(/^(\+62|62|0)8\d{8,11}$/, 'Nomor HP tidak valid');

export const passwordRule = z
  .string({ required_error: 'Kata sandi wajib diisi' })
  .min(8, 'Kata sandi minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf')
  .regex(/\d/, 'Kata sandi harus mengandung angka');

export const nib = z.string().trim().regex(/^\d{13}$/, 'NIB harus 13 digit angka');

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
    nama: z.string().trim().min(3, 'Nama minimal 3 karakter').max(100),
    email: z.string().trim().toLowerCase().email('Format email tidak valid'),
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
  password: z.string({ required_error: 'Kata sandi wajib diisi' }).min(1, 'Kata sandi wajib diisi'),
  remember: z.boolean().optional().default(false),
});

export const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
});

export const resetSchema = z.object({
  token: z.string().min(10, 'Token tidak valid'),
  password: passwordRule,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
  newPassword: passwordRule,
});

// NIB tidak ada di sini: hanya dinas yang boleh mengubah NIB (AC-01-16). Field lain di-strip.
export const updateProfilSchema = z.object(profilFields).partial();
