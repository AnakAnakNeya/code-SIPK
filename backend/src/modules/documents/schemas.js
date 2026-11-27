import { z } from 'zod';
import { JENIS_DOKUMEN } from '../../constants/enums.js';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export const uploadDocumentSchema = z
  .object({
    jenis: z.enum(JENIS_DOKUMEN),
    nomor: z.string().trim().optional(),
    masaBerlaku: z
      .string()
      .optional()
      .transform((val) => (val ? new Date(val) : undefined))
      .refine((date) => !date || !isNaN(date.getTime()), 'Format tanggal masa berlaku tidak valid')
      .refine(
        (date) => !date || isNaN(date.getTime()) || date >= startOfToday(),
        'Masa berlaku tidak boleh sudah lewat',
      ),
    masaSimpanBulan: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => (val !== undefined && val !== '' ? Number(val) : undefined)),
  })
  .superRefine((data, ctx) => {
    // Nomor per jenis (PRD 7.6)
    if (data.jenis === 'nib') {
      if (!data.nomor || !/^\d{13}$/.test(data.nomor)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'NIB harus 13 digit angka',
          path: ['nomor'],
        });
      }
    } else if (['spp_irt', 'halal', 'hak_merek'].includes(data.jenis)) {
      if (!data.nomor || data.nomor.length < 8 || data.nomor.length > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Nomor dokumen harus antara 8 hingga 60 karakter',
          path: ['nomor'],
        });
      }
    }

    // Masa berlaku wajib untuk halal dan spp_irt
    if (['halal', 'spp_irt'].includes(data.jenis) && !data.masaBerlaku) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Masa berlaku wajib diisi untuk dokumen Halal dan SPP-IRT',
        path: ['masaBerlaku'],
      });
    }

    // Masa simpan (bulan) wajib untuk uji_umur_simpan
    if (data.jenis === 'uji_umur_simpan') {
      if (
        data.masaSimpanBulan === undefined ||
        isNaN(data.masaSimpanBulan) ||
        !Number.isInteger(data.masaSimpanBulan) ||
        data.masaSimpanBulan < 1 ||
        data.masaSimpanBulan > 60
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Masa simpan wajib diisi bilangan bulat antara 1 hingga 60 bulan',
          path: ['masaSimpanBulan'],
        });
      }
    }
  });

export const verifyDocumentSchema = z
  .object({
    status: z.enum(['valid', 'perlu_revisi', 'tidak_valid']),
    catatan: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    // AC-02-09: catatan wajib jika bukan 'valid'
    if (data.status !== 'valid' && (!data.catatan || data.catatan.length < 3)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Catatan wajib diisi minimal 3 karakter bila dokumen bukan valid',
        path: ['catatan'],
      });
    }
  });