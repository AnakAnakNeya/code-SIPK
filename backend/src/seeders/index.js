import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import User from '../models/User.js';
import BusinessProfile from '../models/BusinessProfile.js';
import Product from '../models/Product.js';
import ReferencePrice from '../models/ReferencePrice.js';
import RFQ from '../models/RFQ.js';
import Event from '../models/Event.js';
import SintesaQuota from '../models/SintesaQuota.js';
import SintesaRequest from '../models/SintesaRequest.js';
import ForumThread from '../models/ForumThread.js';
import ForumPost from '../models/ForumPost.js';
import { seedUsers, SEED_PASSWORD } from './userSeeder.js';
import { seedBusinesses } from './businessSeeder.js';

export async function runSeeders() {
  console.log('Menjalankan seeder SIPK-Lebak (Sprint 1, 2, 3)...');

  // 1. Users & BusinessProfiles
  const usersByEmail = await seedUsers();
  const businesses = await seedBusinesses(usersByEmail);
  const busAmbu = businesses.find((b) => b.namaUsaha.includes('Ambu'));
  const busAren = businesses.find((b) => b.namaUsaha.includes('Aren'));
  const kabid = usersByEmail['juli@diskop-lebak.go.id'];
  const staf = usersByEmail['staf1@diskop-lebak.go.id'];
  const mitra = usersByEmail['procurement@hotelbanten.example'];

  // 2. Produk Terkurasi
  await Product.deleteMany({});
  const products = await Product.insertMany([
    {
      businessId: busAmbu._id,
      nama: 'Kain Tenun Baduy Suat Samata',
      varian: ['Biru Indigo', 'Hitam Klasik'],
      kategori: 'kriya_tenun',
      subKomoditas: 'Tenun Suat Songket',
      subKomoditasSlug: 'tenun-suat-songket',
      satuan: 'lembar',
      hargaAcuan: 350000,
      kapasitasBulanan: 50,
      deskripsi: 'Kain tenun tradisional khas suku Baduy Luar ditenun secara manual dengan alat ATBM.',
      statusKurasi: 'terkurasi',
      gradeKurasi: 'A',
      terkurasiAt: new Date(),
      nomorSK: 'SK-KURASI-2026-001',
      fotos: [{ path: '/uploads/products/tenun-sample.jpg', thumb: '/uploads/products/tenun-sample-thumb.jpg', ukuran: 150000 }],
    },
    {
      businessId: busAren._id,
      nama: 'Gula Aren Semut Organik Sobang',
      varian: ['250 gram', '500 gram'],
      kategori: 'olahan_pangan',
      subKomoditas: 'Gula Aren Semut',
      subKomoditasSlug: 'gula-aren-semut',
      satuan: 'kg',
      hargaAcuan: 35000,
      kapasitasBulanan: 200,
      deskripsi: 'Gula aren kristal organik dari nira pohon aren pegunungan Sobang Lebak Selatan.',
      statusKurasi: 'terkurasi',
      gradeKurasi: 'A',
      terkurasiAt: new Date(),
      nomorSK: 'SK-KURASI-2026-002',
      fotos: [{ path: '/uploads/products/gula-sample.jpg', thumb: '/uploads/products/gula-sample-thumb.jpg', ukuran: 120000 }],
    },
  ]);
  console.log(`  produk: ${products.length} dibuat`);

  // 3. Harga Acuan Dinas (PBI-07)
  await ReferencePrice.deleteMany({});
  await ReferencePrice.insertMany([
    {
      komoditasSlug: 'gula-aren-semut',
      komoditasNama: 'Gula Aren Semut',
      satuan: 'kg',
      harga: 35000,
      updatedBy: kabid._id,
      riwayat: [{ harga: 35000, at: new Date(), oleh: kabid._id, alasan: 'Penetapan harga acuan awal tahun 2026' }],
    },
    {
      komoditasSlug: 'tenun-suat-songket',
      komoditasNama: 'Tenun Suat Songket',
      satuan: 'lembar',
      harga: 350000,
      updatedBy: kabid._id,
      riwayat: [{ harga: 350000, at: new Date(), oleh: kabid._id, alasan: 'Penetapan harga acuan kurasi tenun 2026' }],
    },
  ]);
  console.log('  harga acuan: 2 komoditas dibuat');

  // 4. RFQ Permintaan Pesanan Mitra (PBI-08)
  await RFQ.deleteMany({});
  const rfqTgl = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  await RFQ.insertMany([
    {
      kode: 'RFQ-2026-0001',
      mitraUserId: mitra._id,
      komoditasSlug: 'gula-aren-semut',
      komoditasNama: 'Gula Aren Semut',
      kategori: 'olahan_pangan',
      satuan: 'kg',
      kuotaTotal: 50,
      kuotaTerkumpul: 0,
      hargaAcuan: 35000,
      tenggat: rfqTgl,
      lokasiKirim: 'Hotel & Konferensi Banten, Jl. Raya Serang-Pandeglang KM 10',
      catatanMutu: 'Kadar air maksimal 2%, kemasan standing pouch ziplock.',
      status: 'terbuka',
    },
  ]);
  console.log('  rfq: 1 permintaan pesanan dibuat');

  // 5. Event Daerah (PBI-12)
  await Event.deleteMany({});
  const now = new Date();
  await Event.insertMany([
    {
      nama: 'Pameran Hari Koperasi (Harkop) Kab. Lebak 2026',
      jenis: 'pameran',
      deskripsi: 'Expo promosi tahunan produk unggulan UMKM Lebak di Alun-Alun Rangkasbitung.',
      lokasi: 'Alun-Alun Rangkasbitung',
      tanggalMulai: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
      tanggalSelesai: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000),
      kuota: 30,
      terisi: 5,
      tenggatDaftar: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      syaratKurasi: true,
      status: 'dibuka',
      createdBy: staf._id,
    },
    {
      nama: 'Gelar Produk Hari UMKM Nasional Tingkat Kabupaten',
      jenis: 'pameran',
      deskripsi: 'Bazar dan kurasi stan langsung bersama offtaker ritel modern.',
      lokasi: 'Plaza Lebak Rangkasbitung',
      tanggalMulai: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      tanggalSelesai: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000),
      kuota: 20,
      terisi: 20,
      tenggatDaftar: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
      syaratKurasi: true,
      status: 'dibuka',
      createdBy: staf._id,
    },
    {
      nama: 'Pelatihan Kurasi Kemasan dan Sertifikasi Halal',
      jenis: 'pelatihan',
      deskripsi: 'Bimtek 2 hari pendampingan perizinan Halal gratis dan uji masa simpan lab.',
      lokasi: 'Aula Diskop UKM Kab. Lebak',
      tanggalMulai: new Date(now.getTime() + 40 * 24 * 60 * 60 * 1000),
      tanggalSelesai: new Date(now.getTime() + 41 * 24 * 60 * 60 * 1000),
      kuota: 35,
      terisi: 12,
      tenggatDaftar: new Date(now.getTime() + 35 * 24 * 60 * 60 * 1000),
      syaratKurasi: false,
      status: 'dibuka',
      createdBy: staf._id,
    },
  ]);
  console.log('  event: 3 agenda pameran & pelatihan dibuat');

  // 6. Sintesa Kuota & Permohonan (PBI-14)
  await SintesaQuota.deleteMany({});
  await SintesaQuota.create({ tahun: 2026, total: 100, terpakai: 58 });

  await SintesaRequest.deleteMany({});
  await SintesaRequest.create({
    kode: 'SIN-2026-001',
    businessId: busAren._id,
    productId: products[1]._id,
    tahun: 2026,
    jenisFasilitasi: 'desain_kemasan',
    kondisiKemasan: 'Saat ini menggunakan plastik bening biasa tanpa ziplock, rentan menggumpal.',
    targetPasar: 'Ritel Modern Alfamart dan Pusat Oleh-oleh Banten.',
    usulanJadwal: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    jadwalFinal: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    desainerNama: 'Rian Pratama (Desainer Grafis Sintesa)',
    status: 'desain_dikerjakan',
    timeline: [
      { at: now, status: 'diajukan', catatan: 'Pengajuan online diterima sistem' },
      { at: now, status: 'dijadwalkan', catatan: 'Konsultasi tatap muka disetujui staf' },
      { at: now, status: 'desain_dikerjakan', catatan: 'Desainer ditugaskan & subsidi cetak dipotong' },
    ],
  });
  console.log('  sintesa: kuota & permohonan contoh dibuat');

  // 7. Forum Komunitas (PBI-13)
  await ForumThread.deleteMany({});
  await ForumPost.deleteMany({});

  const thread1 = await ForumThread.create({
    judul: 'Panduan Lengkap Syarat Kurasi Masuk Ritel Alfamart, Plaza Lebak & Subsidi Sintesa',
    isi: 'Berikut panduan resmi persyaratan kurasi komoditas pangan dan kriya binaan Pemkab Lebak untuk tahun 2026. Pelaku usaha wajib memastikan 13 digit NIB telah valid dan memiliki izin edar SPP-IRT.',
    kategori: 'pengumuman_dinas',
    authorId: kabid._id,
    authorRole: 'kabid',
    authorNama: kabid.nama,
    authorKecamatan: 'Rangkasbitung',
    pinned: true,
    pinnedBy: kabid._id,
    pinnedAt: now,
    replyCount: 0,
    lastActivityAt: now,
  });

  const thread2 = await ForumThread.create({
    judul: 'Cara Mengurus Perpanjangan Sertifikat Halal & Uji Umur Simpan di Lebak?',
    isi: 'Halo bapak/ibu dinas dan rekan UMKM, untuk produk keripik pisang dan gula semut, apakah uji lab umur simpan bisa difasilitasi di PLUT Lebak?',
    kategori: 'legalitas_perizinan',
    authorId: busAren.userId,
    authorRole: 'umkm',
    authorNama: 'Hj. Entin',
    authorKecamatan: 'Sobang',
    replyCount: 1,
    terjawabDinas: true,
    lastActivityAt: now,
  });

  const postOfficial = await ForumPost.create({
    threadId: thread2._id,
    authorId: staf._id,
    authorRole: 'staf',
    authorNama: staf.nama,
    authorKecamatan: 'Rangkasbitung',
    isi: 'Bisa difasilitasi Ibu Entin. Dinas memfasilitasi uji proksimat dan umur simpan gratis melalui kuota laboratorium binaan setiap triwulan. Silakan bawa sampel ke kantor dinas pada hari kerja.',
    jawabanResmi: true,
  });

  thread2.jawabanResmiPostId = postOfficial._id;
  await thread2.save();

  console.log('  forum: thread tersemat & diskusi tanya-jawab dinas dibuat');
  console.log('--- SEEDING SELESAI ---');
  console.log('Semua akun seed menggunakan kata sandi: Password123!');
}

async function run() {
  if (env.isProduction) throw new Error('Seeder tidak boleh dijalankan di production.');
  await connectDB();
  await runSeeders();
  await disconnectDB();
}

// Jalankan otomatis jika dipanggil langsung via CLI
if (process.argv[1]?.includes('seeders') || process.argv[1]?.includes('index.js')) {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
