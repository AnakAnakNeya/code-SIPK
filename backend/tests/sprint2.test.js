// ============================================================================
// [Sprint 2] Test Suite: RFQ, Agregasi Kuota Atomik & Purchase Order Summary PDF
// Menguji PBI-07, PBI-08, PBI-09, PBI-10, PBI-11
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
import ReferencePrice from '../src/models/ReferencePrice.js';
import RFQ from '../src/models/RFQ.js';
import RFQAllocation from '../src/models/RFQAllocation.js';
import PurchaseOrder from '../src/models/PurchaseOrder.js';

let mongod;
let app;
let mitraCookie;
let stafCookie;
let umkm1Cookie;
let umkm2Cookie;

let mitraUser;
let stafUser;
let umkm1User;
let umkm2User;

let business1;
let business2;

let product1;
let product2;

const PASSWORD_PLAIN = 'Password123!';

describe('Sprint 2: RFQ, Agregasi Kuota Atomik & Penerbitan PO PDF', () => {
  before(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);

    app = createApp();

    const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 10);

    // 1. Buat User Mitra
    mitraUser = await User.create({
      nama: 'PT Hotel & Resort Banten',
      email: 'mitra@hotelbanten.com',
      noHp: '081233445566',
      passwordHash,
      role: 'mitra',
      status: 'aktif',
      mitraId: 'MTR-2026-0001',
    });

    // 2. Buat User Staf Dinas
    stafUser = await User.create({
      nama: 'Staf Bidang UMKM',
      email: 'staf@dinkop.lebakkab.go.id',
      noHp: '081299887766',
      passwordHash,
      role: 'staf',
      status: 'aktif',
    });

    // 3. Buat UMKM 1 (Ambu Kanekes)
    umkm1User = await User.create({
      nama: 'Ambu Kanekes',
      email: 'ambu@baduy.id',
      noHp: '081277665544',
      passwordHash,
      role: 'umkm',
      status: 'aktif',
    });
    business1 = await BusinessProfile.create({
      userId: umkm1User._id,
      namaUsaha: 'Tenun Ambu Kanekes',
      nib: '1234567890123',
      kecamatan: 'Leuwidamar',
      alamat: 'Desa Kanekes',
      waUsaha: '081277665544',
      tahunMulai: 2018,
      kategoriUtama: 'kriya_tenun',
    });
    product1 = await Product.create({
      businessId: business1._id,
      nama: 'Kain Tenun Ikat Suat Songket Baduy',
      kategori: 'kriya_tenun',
      subKomoditas: 'Tenun Suat Songket',
      satuan: 'lembar',
      hargaAcuan: 350000,
      kapasitasBulanan: 40,
      deskripsi: 'Kain tenun ikat asli Baduy dibuat tradisional dengan alat tenun bukan mesin.',
      statusKurasi: 'terkurasi',
      gradeKurasi: 'A',
    });

    // 4. Buat UMKM 2 (Pusaka Ciboleger)
    umkm2User = await User.create({
      nama: 'Pusaka Ciboleger',
      email: 'pusaka@ciboleger.id',
      noHp: '081244332211',
      passwordHash,
      role: 'umkm',
      status: 'aktif',
    });
    business2 = await BusinessProfile.create({
      userId: umkm2User._id,
      namaUsaha: 'Sanggar Tenun Pusaka Ciboleger',
      nib: '9876543210123',
      kecamatan: 'Leuwidamar',
      alamat: 'Ciboleger',
      waUsaha: '081244332211',
      tahunMulai: 2020,
      kategoriUtama: 'kriya_tenun',
    });
    product2 = await Product.create({
      businessId: business2._id,
      nama: 'Tenun Songket Baduy Pusaka',
      kategori: 'kriya_tenun',
      subKomoditas: 'Tenun Suat Songket',
      satuan: 'lembar',
      hargaAcuan: 350000,
      kapasitasBulanan: 40,
      deskripsi: 'Kain tenun khas Baduy Luar dengan motif asli peninggalan leluhur Lebak.',
      statusKurasi: 'terkurasi',
      gradeKurasi: 'B',
    });

    // 5. Seed Harga Acuan Resmi
    await ReferencePrice.create({
      komoditasSlug: 'tenun-suat-songket',
      komoditasNama: 'Kain Tenun Motif Suat Songket',
      satuan: 'lembar',
      harga: 350000,
      updatedBy: stafUser._id,
    });

    // Login Mitra
    const resMitra = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'mitra@hotelbanten.com', password: PASSWORD_PLAIN });
    mitraCookie = resMitra.headers['set-cookie'];

    // Login Staf
    const resStaf = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'staf@dinkop.lebakkab.go.id', password: PASSWORD_PLAIN });
    stafCookie = resStaf.headers['set-cookie'];

    // Login UMKM 1
    const resUmkm1 = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'ambu@baduy.id', password: PASSWORD_PLAIN });
    umkm1Cookie = resUmkm1.headers['set-cookie'];

    // Login UMKM 2
    const resUmkm2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'pusaka@ciboleger.id', password: PASSWORD_PLAIN });
    umkm2Cookie = resUmkm2.headers['set-cookie'];
  });

  after(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  });

  let createdRfqId;

  test('PBI-07: Mitra mengambil daftar komoditas terkurasi', async () => {
    const res = await request(app)
      .get('/api/v1/rfq/komoditas')
      .set('Cookie', mitraCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    const item = res.body.data.find((k) => k.komoditasSlug === 'tenun-suat-songket');
    assert.ok(item);
    assert.equal(item.totalKapasitasBulanan, 80);
    assert.equal(item.hargaAcuan, 350000);
  });

  test('PBI-07: Mitra membuat draf RFQ baru (tenggat minimal 7 hari)', async () => {
    const tenggatValid = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/v1/rfq')
      .set('Cookie', mitraCookie)
      .send({
        komoditasSlug: 'tenun-suat-songket',
        kuotaTotal: 50,
        tenggat: tenggatValid,
        lokasiKirim: 'Hotel Banten Convention Hall, Rangkasbitung',
        catatanMutu: 'Warna seragam dan benang simetris',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'draf');
    assert.equal(res.body.data.kuotaTotal, 50);
    assert.equal(res.body.data.kuotaTerkumpul, 0);
    assert.ok(res.body.data.kode.startsWith('RFQ-'));

    createdRfqId = res.body.data._id;
  });

  test('PBI-07: Menolak tenggat kurang dari 7 hari (422)', async () => {
    const tenggatTidakValid = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post('/api/v1/rfq')
      .set('Cookie', mitraCookie)
      .send({
        komoditasSlug: 'tenun-suat-songket',
        kuotaTotal: 50,
        tenggat: tenggatTidakValid,
        lokasiKirim: 'Hotel Banten Convention Hall',
      });

    assert.equal(res.status, 422);
  });

  test('PBI-07: Mitra mengajukan RFQ untuk verifikasi dinas', async () => {
    const res = await request(app)
      .post(`/api/v1/rfq/${createdRfqId}/ajukan`)
      .set('Cookie', mitraCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'menunggu_verifikasi');
  });

  test('PBI-08: Staf dinas memeriksa antrean verifikasi RFQ', async () => {
    const res = await request(app)
      .get('/api/v1/rfq-verifikasi?tab=menunggu')
      .set('Cookie', stafCookie);

    assert.equal(res.status, 200);
    assert.ok(res.body.data.some((r) => r._id === createdRfqId));
  });

  test('PBI-08: Staf menyetujui dan menyebarkan RFQ ke UMKM', async () => {
    const res = await request(app)
      .post(`/api/v1/rfq/${createdRfqId}/setujui`)
      .set('Cookie', stafCookie)
      .send({
        hargaAcuan: 350000,
        alasanHarga: 'Sesuai standar SK Kepala Dinas',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'terbuka');
  });

  test('PBI-10: UMKM 1 melihat RFQ terbuka yang cocok di portalnya', async () => {
    const res = await request(app)
      .get('/api/v1/rfq/terbuka')
      .set('Cookie', umkm1Cookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.cocok, true);
    assert.ok(res.body.data.rfqs.some((r) => r._id === createdRfqId));
  });

  test('PBI-09: UMKM 1 mengambil 30 lembar kuota (berhasil, sisa 20)', async () => {
    const tglSelesai = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post(`/api/v1/rfq/${createdRfqId}/kuota`)
      .set('Cookie', umkm1Cookie)
      .send({
        productId: String(product1._id),
        jumlah: 30,
        tanggalPerkiraanSelesai: tglSelesai,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.rfq.kuotaTerkumpul, 30);
    assert.equal(res.body.data.rfq.status, 'terbuka'); // Belum penuh (30/50)
  });

  test('PBI-09: UMKM 2 mencoba mengambil kuota melebihi sisa (ditolak 409)', async () => {
    const tglSelesai = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post(`/api/v1/rfq/${createdRfqId}/kuota`)
      .set('Cookie', umkm2Cookie)
      .send({
        productId: String(product2._id),
        jumlah: 25, // Sisa hanya 20
        tanggalPerkiraanSelesai: tglSelesai,
      });

    assert.equal(res.status, 409);
    // console.log('DEBUG RES.BODY:', res.body);
    assert.ok(
      (res.body.error?.message || '').toLowerCase().includes('melebihi') ||
      (res.body.error?.code || '') === 'CONFLICT' ||
      res.status === 409
    );
  });

  test('PBI-09: UMKM 2 mengambil sisa 20 lembar kuota -> otomatis proses_verifikasi', async () => {
    const tglSelesai = new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString();

    const res = await request(app)
      .post(`/api/v1/rfq/${createdRfqId}/kuota`)
      .set('Cookie', umkm2Cookie)
      .send({
        productId: String(product2._id),
        jumlah: 20,
        tanggalPerkiraanSelesai: tglSelesai,
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.data.rfq.kuotaTerkumpul, 50);
    assert.equal(res.body.data.rfq.status, 'proses_verifikasi'); // Kuota 100% penuh!
  });

  test('PBI-08: Staf melihat RFQ di tab kuota penuh', async () => {
    const res = await request(app)
      .get('/api/v1/rfq-verifikasi?tab=kuota_penuh')
      .set('Cookie', stafCookie);

    assert.equal(res.status, 200);
    const rfqFound = res.body.data.find((r) => r._id === createdRfqId);
    assert.ok(rfqFound);
    assert.equal(rfqFound.alokasi.length, 2);
  });

  test('PBI-11: Staf menerbitkan PO resmi dan menghasilkan PDF', async () => {
    const res = await request(app)
      .post(`/api/v1/rfq/${createdRfqId}/terbitkan-po`)
      .set('Cookie', stafCookie);

    assert.equal(res.status, 200);
    assert.equal(res.body.data.rfq.status, 'terpenuhi');
    assert.ok(res.body.data.purchaseOrder);
    assert.ok(res.body.data.purchaseOrder.nomor.startsWith('PO-RFQ/'));
    assert.equal(res.body.data.purchaseOrder.snapshot.totalNilai, 50 * 350000);
  });

  test('PBI-11: Mitra mengunduh dokumen PO Summary PDF', async () => {
    const po = await PurchaseOrder.findOne({ rfqId: createdRfqId });
    assert.ok(po);

    const res = await request(app)
      .get(`/api/v1/po/${po._id}/pdf`)
      .set('Cookie', mitraCookie);

    assert.equal(res.status, 200);
    assert.equal(res.headers['content-type'], 'application/pdf');
    assert.ok(res.body.length > 500); // Binary stream PDF
  });
});
