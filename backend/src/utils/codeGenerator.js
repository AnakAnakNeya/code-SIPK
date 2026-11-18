import Counter from '../models/Counter.js';

const ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
export const romawiBulan = (month) => ROMAWI[month - 1];

const pad = (n, len) => String(n).padStart(len, '0');

const FORMATS = {
  KUR: ({ year, seq }) => `KUR-${year}-${pad(seq, 3)}`,
  'SK-KUR': ({ year, month, seq }) => `SK-KUR/${pad(seq, 3)}/${romawiBulan(month)}/${year}`,
  MTR: ({ year, seq }) => `MTR-${year}-${pad(seq, 4)}`,
  RFQ: ({ year, seq }) => `RFQ-${year}-${pad(seq, 3)}`,
  'PO-RFQ': ({ year, month, seq }) => `PO-RFQ/${year}/${romawiBulan(month)}/${pad(seq, 3)}`,
  SIN: ({ year, seq }) => `SIN-${year}-${pad(seq, 3)}`,
};

/**
 * Membuat nomor dokumen secara atomik. Urutan reset tiap tahun (key counter memuat tahun).
 * generateCode('KUR') -> 'KUR-2026-084'
 */
export async function generateCode(prefix, { year, month } = {}) {
  const format = FORMATS[prefix];
  if (!format) throw new Error(`Prefix penomoran tidak dikenal: ${prefix}`);
  const now = new Date();
  const y = year ?? now.getFullYear();
  const m = month ?? now.getMonth() + 1;
  const counter = await Counter.findOneAndUpdate(
    { _id: `${prefix}-${y}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return format({ year: y, month: m, seq: counter.seq });
}
