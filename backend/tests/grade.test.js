import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hitungGrade } from '../src/modules/kurasi/grade.js';

describe('hitungGrade() - Kriya Tenun', () => {
  it('mengembalikan null jika syarat dasar belum lengkap', () => {
    const res = hitungGrade({
      kategori: 'kriya_tenun',
      checks: { profil: 'valid', nib: 'perlu_revisi', kemasan_label: 'valid' },
    });
    assert.equal(res, null);
  });

  it('mengembalikan grade B jika syarat dasar valid tanpa hak merek', () => {
    const res = hitungGrade({
      kategori: 'kriya_tenun',
      checks: { profil: 'valid', nib: 'valid', kemasan_label: 'valid' },
    });
    assert.equal(res, 'B');
  });

  it('mengembalikan grade A jika syarat dasar valid dan memiliki hak merek valid', () => {
    const res = hitungGrade({
      kategori: 'kriya_tenun',
      checks: {
        profil: 'valid',
        nib: 'valid',
        kemasan_label: 'valid',
        hak_merek: 'valid',
      },
    });
    assert.equal(res, 'A');
  });
});

describe('hitungGrade() - Olahan Pangan', () => {
  it('mengembalikan null jika tanpa SPP-IRT valid', () => {
    const res = hitungGrade({
      kategori: 'olahan_pangan',
      checks: {
        profil: 'valid',
        nib: 'valid',
        kemasan_label: 'valid',
        spp_irt: 'perlu_revisi',
      },
      masaSimpanBulan: 12,
    });
    assert.equal(res, null);
  });

  it('mengembalikan grade B jika SPP-IRT valid tetapi umur simpan < 12 bulan', () => {
    const res = hitungGrade({
      kategori: 'olahan_pangan',
      checks: {
        profil: 'valid',
        nib: 'valid',
        kemasan_label: 'valid',
        spp_irt: 'valid',
        halal: 'valid',
        uji_umur_simpan: 'valid',
      },
      masaSimpanBulan: 6,
    });
    assert.equal(res, 'B');
  });

  it('mengembalikan grade A jika semua butir valid dan umur simpan >= 12 bulan', () => {
    const res = hitungGrade({
      kategori: 'olahan_pangan',
      checks: {
        profil: 'valid',
        nib: 'valid',
        kemasan_label: 'valid',
        spp_irt: 'valid',
        halal: 'valid',
        uji_umur_simpan: 'valid',
      },
      masaSimpanBulan: 12,
    });
    assert.equal(res, 'A');
  });
});
