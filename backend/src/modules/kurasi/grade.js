// Logika penentuan grade kurasi produk (AC-04-14, PRD 9.3)
export function hitungGrade({ kategori, checks = {}, masaSimpanBulan = 0 }) {
  const ok = (k) => checks[k] === 'valid';
  const dasar = ok('profil') && ok('nib') && ok('kemasan_label');

  if (kategori === 'kriya_tenun') {
    if (!dasar) return null; // tidak layak
    return ok('hak_merek') ? 'A' : 'B';
  }

  // Olahan pangan
  if (!(dasar && ok('spp_irt'))) return null;
  const siapRitel = ok('halal') && ok('uji_umur_simpan') && masaSimpanBulan >= 12;
  return siapRitel ? 'A' : 'B';
}
