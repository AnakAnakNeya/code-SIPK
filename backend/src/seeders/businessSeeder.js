import BusinessProfile from '../models/BusinessProfile.js';

const BUSINESSES = [
  {
    email: 'ambu.kanekes@example.com', namaUsaha: 'UMKM Tenun Ambu Kanekes', kecamatan: 'Leuwidamar', nib: '9120300451829',
    kategoriUtama: 'kriya_tenun', subKomoditas: ['Tenun Suat Songket'],
    alamat: 'Kampung Kadu Ketug RT 02/RW 01', tahunMulai: 2018, waUsaha: '081298441920',
  },
  {
    email: 'aren.jaya@example.com', namaUsaha: 'KUB Aren Jaya Sobang', kecamatan: 'Sobang', nib: '9120300451830',
    kategoriUtama: 'olahan_pangan', subKomoditas: ['Gula Aren Semut'],
    alamat: 'Desa Sobang RT 01/RW 03', tahunMulai: 2015, waUsaha: '081377112233',
  },
  {
    email: 'berkah.pangan@example.com', namaUsaha: 'UMKM Berkah Pangan', kecamatan: 'Rangkasbitung', nib: '9120300451831',
    kategoriUtama: 'olahan_pangan', subKomoditas: ['Keripik Pisang'],
    alamat: 'Jl. Multatuli No. 12 Rangkasbitung', tahunMulai: 2021, waUsaha: '081355667788',
  },
];

export async function seedBusinesses(usersByEmail) {
  await BusinessProfile.deleteMany({ nib: { $in: BUSINESSES.map((b) => b.nib) } });
  const docs = BUSINESSES.map(({ email, ...rest }) => ({
    ...rest,
    userId: usersByEmail[email]._id,
    pernyataanBenarAt: new Date(),
  }));
  const created = await BusinessProfile.insertMany(docs);
  console.log(`  profil usaha: ${created.length} dibuat`);
  return created;
}
