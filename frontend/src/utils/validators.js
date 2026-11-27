// ============================================================================
// Aturan validasi input bersama (harus selaras dengan backend/src/modules/auth/schemas.js)
// ============================================================================

export const PHONE_MIN = 10;
export const PHONE_MAX = 13;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;
export const NIB_LENGTH = 13;

/** Hanya sisakan angka. */
export const digitsOnly = (value = '') => String(value).replace(/\D/g, '');

/** Izinkan angka dan satu tanda + di awal (untuk +62), buang karakter lain. */
export const sanitizePhoneInput = (value = '') => {
  const raw = String(value).replace(/[^\d+]/g, '');
  return raw.startsWith('+') ? `+${raw.slice(1).replace(/\+/g, '')}` : raw.replace(/\+/g, '');
};

/** +62 / 62 -> 0 (sama seperti normalisasi backend). */
export function normalizePhone(value = '') {
  let v = String(value).replace(/[\s().-]/g, '');
  if (v.startsWith('+62')) v = `0${v.slice(3)}`;
  else if (v.startsWith('62')) v = `0${v.slice(2)}`;
  return v;
}

/** Mengembalikan pesan error atau null jika valid. */
export function phoneError(value, label = 'Nomor HP') {
  const v = normalizePhone(value);
  if (!v) return `${label} wajib diisi`;
  if (!/^\d+$/.test(v)) return `${label} hanya boleh berisi angka`;
  if (!v.startsWith('08')) return `${label} harus diawali 08 (atau +62 8)`;
  if (v.length < PHONE_MIN) return `${label} minimal ${PHONE_MIN} digit`;
  if (v.length > PHONE_MAX) return `${label} maksimal ${PHONE_MAX} digit`;
  return null;
}

export function nameError(value, label = 'Nama') {
  const v = String(value || '').trim();
  if (v.length < 3) return `${label} minimal 3 karakter`;
  if (v.length > 100) return `${label} maksimal 100 karakter`;
  if (!/^[\p{L}][\p{L}\s.'-]*$/u.test(v)) {
    return `${label} hanya boleh berisi huruf, spasi, titik, apostrof, dan tanda hubung`;
  }
  return null;
}

export function emailError(value) {
  const v = String(value || '').trim();
  if (!v) return 'Email wajib diisi';
  if (v.length > 254) return 'Email maksimal 254 karakter';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'Format email tidak valid (contoh: nama@contoh.com)';
  return null;
}

export function nibError(value) {
  return /^\d{13}$/.test(String(value || '').trim()) ? null : `NIB harus tepat ${NIB_LENGTH} digit angka`;
}

/** Daftar aturan kata sandi untuk checklist langsung di form. */
export const PASSWORD_RULES = [
  { id: 'len', label: `${PASSWORD_MIN}-${PASSWORD_MAX} karakter`, test: (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX },
  { id: 'upper', label: 'Huruf besar (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'Huruf kecil (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'Angka (0-9)', test: (p) => /\d/.test(p) },
  { id: 'symbol', label: 'Simbol (! @ # $ % dst.)', test: (p) => /[^A-Za-z0-9\s]/.test(p) },
  { id: 'space', label: 'Tanpa spasi', test: (p) => p.length > 0 && /^\S+$/.test(p) },
];

export const checkPassword = (password = '') =>
  PASSWORD_RULES.map((rule) => ({ ...rule, ok: rule.test(password) }));

/** Pesan error pertama yang belum terpenuhi, atau null jika semua lolos. */
export function passwordError(password = '', label = 'Kata sandi') {
  if (!password) return `${label} wajib diisi`;
  const gagal = checkPassword(password).find((r) => !r.ok);
  if (!gagal) return null;
  const pesan = {
    len: `${label} harus ${PASSWORD_MIN}-${PASSWORD_MAX} karakter`,
    upper: `${label} harus mengandung huruf besar`,
    lower: `${label} harus mengandung huruf kecil`,
    digit: `${label} harus mengandung angka`,
    symbol: `${label} harus mengandung simbol (contoh: ! @ # $ %)`,
    space: `${label} tidak boleh mengandung spasi`,
  };
  return pesan[gagal.id];
}

/** Skor 0-4 untuk indikator kekuatan. */
export function passwordStrength(password = '') {
  const lulus = checkPassword(password).filter((r) => r.ok).length;
  const bonus = password.length >= 12 ? 1 : 0;
  const skor = Math.min(4, Math.max(0, Math.floor(((lulus + bonus) / (PASSWORD_RULES.length + 1)) * 4.99)));
  return { skor, label: ['Sangat lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat kuat'][skor] };
}
