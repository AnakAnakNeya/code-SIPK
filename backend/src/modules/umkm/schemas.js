// ============================================================================
// [PBI-06] Skema validasi Zod untuk direktori, persetujuan akun, dan
//          pendaftaran UMKM manual oleh dinas. PIC: Naila
// ============================================================================
import mongoose from 'mongoose';
import { z } from 'zod';
import { KATEGORI } from '../../constants/enums.js';
import { KECAMATAN } from '../../constants/kecamatan.js';
import { nib, noHp } from '../auth/schemas.js';

const kategoriValues = Object.values(KATEGORI);

/** :id harus ObjectId valid -> 404 rapi, bukan CastError 500. */
export const idParamSchema = z.object({
  id: z.string().refine((v) => mongoose.isValidObjectId(v), 'ID tidak valid'),
});

/** Query direktori: page/limit dibatasi agar tidak bisa menarik seluruh koleksi. */
export const directoryQuerySchema = z
  .object({
    kecamatan: z.string().trim().optional(),
    kategori: z.string().trim().optional(),
    statusAkun: z.string().trim().optional(),
    q: z.string().trim().max(100, 'Kata kunci maksimal 100 karakter').optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  })
  .passthrough();

export const verifyAccountSchema = z
  .object({
    keputusan: z.enum(['setuju', 'tolak'], {
      errorMap: () => ({ message: "Keputusan harus 'setuju' atau 'tolak'" }),
    }),
    catatan: z.string().trim().max(500, 'Catatan maksimal 500 karakter').optional(),
  })
  .refine((v) => v.keputusan !== 'tolak' || (v.catatan && v.catatan.length >= 5), {
    path: ['catatan'],
    message: 'Alasan penolakan wajib diisi (minimal 5 karakter)',
  });

export const registerManualSchema = z.object({
  nama: z.string().trim().min(3, 'Nama pemilik minimal 3 karakter').max(100),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  noHp,
  namaUsaha: z.string().trim().min(3, 'Nama usaha minimal 3 karakter').max(120),
  kecamatan: z.enum(KECAMATAN, { errorMap: () => ({ message: 'Pilih kecamatan di Kabupaten Lebak' }) }),
  kategoriUtama: z
    .enum(kategoriValues, { errorMap: () => ({ message: 'Pilih kategori kriya tenun atau olahan pangan' }) })
    .default(KATEGORI.PANGAN),
  // Boleh berupa string "a, b" (form dinas) atau array.
  subKomoditas: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      const list = Array.isArray(v) ? v : String(v ?? '').split(',');
      return list.map((s) => s.trim()).filter(Boolean).slice(0, 5);
    }),
  nib,
  alamat: z.string().trim().min(10, 'Alamat minimal 10 karakter').max(300),
  waUsaha: noHp.optional().or(z.literal('')),
});
