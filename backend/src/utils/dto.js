// DTO: jangan pernah mengembalikan passwordHash, path file privat, atau dokumen mentah model.

export function businessDto(b) {
  if (!b) return null;
  return {
    id: String(b._id),
    namaUsaha: b.namaUsaha,
    kecamatan: b.kecamatan,
    alamat: b.alamat,
    tahunMulai: b.tahunMulai,
    waUsaha: b.waUsaha,
    nib: b.nib,
    kategoriUtama: b.kategoriUtama,
    subKomoditas: b.subKomoditas ?? [],
    updatedAt: b.updatedAt,
  };
}

export function userDto(u, business = null) {
  return {
    id: String(u._id),
    nama: u.nama,
    email: u.email,
    noHp: u.noHp,
    role: u.role,
    status: u.status,
    catatanStatus: u.catatanStatus ?? null,
    mustChangePassword: Boolean(u.mustChangePassword),
    mitraId: u.mitraId ?? null,
    business: businessDto(business),
  };
}

export function documentDto(doc) {
  if (!doc) return null;
  return {
    id: String(doc._id),
    businessId: String(doc.businessId),
    jenis: doc.jenis,
    nomor: doc.nomor ?? null,
    masaBerlaku: doc.masaBerlaku ?? null,
    masaSimpanBulan: doc.masaSimpanBulan ?? null,
    statusVerifikasi: doc.statusVerifikasi,
    catatan: doc.catatan ?? null,
    verifiedAt: doc.verifiedAt ?? null,
    kedaluwarsa: Boolean(doc.kedaluwarsa),
    file: doc.file
      ? {
          namaAsli: doc.file.namaAsli,
          mime: doc.file.mime,
          ukuran: doc.file.ukuran,
        }
      : null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
