// ============================================================================
// [Sprint 3] Test Suite: Event, Forum, Sintesa, Dasbor Analitik, & Akun/Audit
// Menguji PBI-12, PBI-13, PBI-14, PBI-15, PBI-16
// ============================================================================

import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';

import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import BusinessProfile from '../src/models/BusinessProfile.js';
import Product from '../src/models/Product.js';
import LegalDocument from '../src/models/LegalDocument.js';
import Event from '../src/models/Event.js';
import SintesaQuota from '../src/models/SintesaQuota.js';
import SintesaRequest from '../src/models/SintesaRequest.js';

let mongod;
let app;
let kabidCookie;
let stafCookie;
let umkmCookie;
let mitraCookie;

let kabidUser;
let stafUser;
let umkmUser;
let mitraUser;
let business;
let product;

const PASSWORD_PLAIN = 'Password123!';

describe('Sprint 3: Event, Forum, Sintesa, Dasbor, dan Manajemen Akun', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    app = createApp();

    const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

    // 1. User Kabid
    kabidUser = await User.create({
      nama: 'Juli Zakiah, S.Sos., M.Si.',
      email: 'kabid@dinkop.lebakkab.go.id',
      noHp: '081299881122',
      passwordHash,
      role: 'kabid',
      status: 'aktif',
    });

    // 2. User Staf
    stafUser = await User.create({
      nama: 'Staf Bidang UMKM',
      email: 'staf@dinkop.lebakkab.go.id',
      noHp: '081299883344',
      passwordHash,
      role: 'staf',
      status: 'aktif',
    });

    // 3. User UMKM
    umkmUser = await User.create({
      nama: 'Pelaku Usaha Tenun Baduy',
      email: 'tenun@baduy.id',
      noHp: '081255443322',
      passwordHash,
      role: 'umkm',
      status: 'aktif',
    });
    business = await BusinessProfile.create({
      userId: umkmUser._id,
      namaUsaha: 'UMKM Tenun Baduy Asli',
      nib: '1234567890999',
      kecamatan: 'Leuwidamar',
      alamat: 'Kanekes',
      waUsaha: '081255443322',
      tahunMulai: 2019,
      kategoriUtama: 'kriya_tenun',
    });
    product = await Product.create({
      businessId: business._id,
      nama: 'Kain Tenun Suat Songket Super',
      kategori: 'kriya_tenun',
      subKomoditas: 'Tenun Suat Songket',
      satuan: 'lembar',
      hargaAcuan: 350000,
      kapasitasBulanan: 50,
      deskripsi: 'Kain tenun ikat khas Baduy Luar dibuat dengan alat tenun tradisional.',
      statusKurasi: 'terkurasi',
      gradeKurasi: 'A',
    });
    // Dokumen NIB Valid untuk syarat Sintesa
    await LegalDocument.create({
      businessId: business._id,
      jenis: 'nib',
      nomor: '1234567890999',
      statusVerifikasi: 'valid',
      file: { path: 'dummy.pdf', namaAsli: 'nib.pdf', mime: 'application/pdf', ukuran: 1000 },
    });

    // 4. User Mitra
    mitraUser = await User.create({
      nama: 'Mitra Hotel Banten',
      email: 'mitra@banten.com',
      noHp: '081233221100',
      passwordHash,
      role: 'mitra',
      status: 'aktif',
      mitraId: 'MTR-2026-0001',
    });

    // Inisialisasi Kuota Sintesa
    await SintesaQuota.create({
      tahun: new Date().getFullYear(),
      total: 100,
      terpakai: 20,
    });

    // Login Kabid
    const resKabid = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'kabid@dinkop.lebakkab.go.id', password: PASSWORD_PLAIN });
    kabidCookie = resKabid.headers['set-cookie'];

    // Login Staf
    const resStaf = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'staf@dinkop.lebakkab.go.id', password: PASSWORD_PLAIN });
    stafCookie = resStaf.headers['set-cookie'];

    // Login UMKM
    const resUmkm = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'tenun@baduy.id', password: PASSWORD_PLAIN });
    umkmCookie = resUmkm.headers['set-cookie'];

    // Login Mitra
    const resMitra = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'mitra@banten.com', password: PASSWORD_PLAIN });
    mitraCookie = resMitra.headers['set-cookie'];
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  let createdEventId;
  let createdRegId;
  let createdThreadId;
  let createdPostId;
  let createdSintesaId;

  // ==========================================
  // PBI-12: Event Daerah & Pendaftaran Stan
  // ==========================================
  test('PBI-12: Staf membuat event pameran baru', async () => {
    const res = await request(app)
      .post('/api/v1/events')
      .set('Cookie', stafCookie)
      .send({
        nama: 'Pameran Hari Koperasi (Harkop) Lebak 2026',
        jenis: 'pameran',
        deskripsi: 'Pameran tahunan menampilkan produk unggulan komoditas Lebak',
        lokasi: 'Alun-Alun Rangkasbitung',
        tanggalMulai: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        tanggalSelesai: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        kuota: 25,
        tenggatDaftar: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        syaratKurasi: true,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'draf');
    createdEventId = res.body.data._id;
  });

  test('PBI-12: Staf mempublikasikan event sehingga terbuka untuk UMKM', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${createdEventId}/publikasi`)
      .set('Cookie', stafCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'dibuka');
  });

  test('PBI-12: UMKM mendaftar stan pameran secara atomik', async () => {
    const res = await request(app)
      .post(`/api/v1/events/${createdEventId}/daftar`)
      .set('Cookie', umkmCookie)
      .send({ productId: String(product._id) });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.event.terisi, 1);
    assert.equal(res.body.data.registration.status, 'menunggu_verifikasi');
    createdRegId = res.body.data.registration._id;
  });

  test('PBI-12: Staf memverifikasi dan menyetujui peserta pameran', async () => {
    const res = await request(app)
      .patch(`/api/v1/events/${createdEventId}/peserta/${createdRegId}`)
      .set('Cookie', stafCookie)
      .send({
        keputusan: 'setuju',
        catatan: 'Dokumen legalitas dan kurasi lengkap',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'disetujui');
  });

  // ==========================================
  // PBI-13: Forum Komunitas
  // ==========================================
  test('PBI-13: Mitra ditolak mengakses forum komunitas (403)', async () => {
    const res = await request(app)
      .get('/api/v1/forum/threads')
      .set('Cookie', mitraCookie);

    assert.equal(res.status, 403);
  });

  test('PBI-13: UMKM membuat topik diskusi di forum komunitas', async () => {
    const res = await request(app)
      .post('/api/v1/forum/threads')
      .set('Cookie', umkmCookie)
      .send({
        judul: 'Bagaimana cara mendaftar fasilitasi kemasan gratis di Rumah Kemasan Sintesa?',
        kategori: 'kemasan',
        isi: 'Halo bapak/ibu dinas, apakah ada kuota gratis untuk desain kemasan tenun Baduy tahun ini?',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.kategori, 'kemasan');
    createdThreadId = res.body.data._id;
  });

  test('PBI-13: Staf dinas membalas dan menandai sebagai Jawaban Resmi Dinas', async () => {
    // 1. Kirim balasan staf
    const resPost = await request(app)
      .post(`/api/v1/forum/threads/${createdThreadId}/posts`)
      .set('Cookie', stafCookie)
      .send({
        isi: 'Halo Ambu, kuota subsidi cetak Sintesa masih tersedia 80 paket. Syaratnya wajib memiliki NIB valid dan produk terkurasi.',
      });

    assert.equal(resPost.status, 201);
    createdPostId = resPost.body.data._id;

    // 2. Tandai jawaban resmi
    const resMark = await request(app)
      .post(`/api/v1/forum/posts/${createdPostId}/jawaban-resmi`)
      .set('Cookie', stafCookie);

    assert.equal(resMark.status, 200);
    assert.equal(resMark.body.data.jawabanResmi, true);
  });

  // ==========================================
  // PBI-14: Layanan Rumah Kemasan Sintesa
  // ==========================================
  test('PBI-14: Cek sisa kuota subsidi cetak Sintesa', async () => {
    const res = await request(app)
      .get('/api/v1/sintesa/kuota')
      .set('Cookie', umkmCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.total, 100);
    assert.equal(res.body.data.terpakai, 20);
    assert.equal(res.body.data.sisa, 80);
  });

  test('PBI-14: UMKM mengajukan fasilitasi desain kemasan Sintesa', async () => {
    const tglUsulan = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/v1/sintesa')
      .set('Cookie', umkmCookie)
      .send({
        productId: String(product._id),
        jenisFasilitasi: 'keduanya',
        kondisiKemasan: 'Kemasan plastik biasa tanpa logo resmi',
        targetPasar: 'Wisatawan domestik dan hotel bintang di Banten',
        usulanJadwal: tglUsulan,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.status, 'diajukan');
    createdSintesaId = res.body.data._id;
  });

  test('PBI-14: Staf menetapkan desainer dan memotong kuota subsidi cetak secara atomik', async () => {
    const res = await request(app)
      .post(`/api/v1/sintesa/${createdSintesaId}/desainer`)
      .set('Cookie', stafCookie)
      .send({ desainerNama: 'Kang Dedi (Desainer Grafis PLUT Lebak)' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'desain_dikerjakan');

    // Cek kuota terpakai bertambah dari 20 menjadi 21
    const resQuota = await request(app)
      .get('/api/v1/sintesa/kuota')
      .set('Cookie', stafCookie);

    assert.equal(resQuota.body.data.terpakai, 21);
    assert.equal(resQuota.body.data.sisa, 79);
  });

  // ==========================================
  // PBI-15: Dasbor Analitik Dinas & UMKM
  // ==========================================
  test('PBI-15: Staf mengakses dasbor analitik dinas (4 KPI & sebaran kecamatan)', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/dinas?periode=30d')
      .set('Cookie', stafCookie);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.kpi);
    assert.equal(res.body.data.kpi.umkmTerdaftar, 1);
    assert.equal(res.body.data.kpi.produkLolosKurasi, 1);
    assert.ok(Array.isArray(res.body.data.sebaranKecamatan));
    assert.ok(Array.isArray(res.body.data.agendaEvent));
  });

  test('PBI-15: UMKM mengakses ringkasan dasbor personal', async () => {
    const res = await request(app)
      .get('/api/v1/dashboard/umkm')
      .set('Cookie', umkmCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.profil.namaUsaha, 'UMKM Tenun Baduy Asli');
    assert.equal(res.body.data.produk.terkurasi, 1);
  });

  // ==========================================
  // PBI-16: Manajemen Akun & Log Audit
  // ==========================================
  test('PBI-16: Staf ditolak mengakses menu akun kabid (403)', async () => {
    const res = await request(app)
      .get('/api/v1/accounts')
      .set('Cookie', stafCookie);

    assert.equal(res.status, 403);
  });

  test('PBI-16: Kabid membuat akun staf baru dengan kata sandi sementara', async () => {
    const res = await request(app)
      .post('/api/v1/accounts')
      .set('Cookie', kabidCookie)
      .send({
        nama: 'Asep Saepudin, S.E.',
        email: 'asep.staf@dinkop.lebakkab.go.id',
        noHp: '081288776655',
        role: 'staf',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.user.role, 'staf');
    assert.equal(res.body.data.user.mustChangePassword, true);
    assert.ok(res.body.data.tempPassword); // Ditampilkan sekali kepada Kabid
  });

  test('PBI-16: Kabid melihat matriks hak akses dan riwayat log audit', async () => {
    const resMatrix = await request(app)
      .get('/api/v1/permissions/matrix')
      .set('Cookie', kabidCookie);

    assert.equal(resMatrix.status, 200);
    assert.ok(Array.isArray(resMatrix.body.data));

    const resAudit = await request(app)
      .get('/api/v1/audit-logs')
      .set('Cookie', kabidCookie);

    assert.equal(resAudit.status, 200);
    assert.ok(resAudit.body.data.items.length > 0);
  });
});
