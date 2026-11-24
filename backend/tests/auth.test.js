import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const { createApp } = await import('../src/app.js');
const { default: User } = await import('../src/models/User.js');
const { default: BusinessProfile } = await import('../src/models/BusinessProfile.js');
const { default: AuditLog } = await import('../src/models/AuditLog.js');
const { hashPassword } = await import('../src/modules/auth/service.js');

const API = '/api/v1';
const app = createApp();
let mongod;

const payload = (over = {}) => ({
  nama: 'Hj. Entin',
  email: 'entin@example.com',
  noHp: '081377112233',
  password: 'Password123',
  konfirmasiPassword: 'Password123',
  namaUsaha: 'KUB Aren Jaya',
  kecamatan: 'Sobang',
  tahunMulai: 2015,
  alamat: 'Desa Sobang RT 01/RW 03',
  waUsaha: '081377112233',
  nib: '1234567890123',
  kategoriUtama: 'olahan_pangan',
  subKomoditas: ['Gula Aren Semut'],
  pernyataanBenar: true,
  ...over,
});

async function makeUser(over = {}) {
  return User.create({
    nama: 'Staf Uji', email: 'staf@example.com', noHp: '081200000009',
    passwordHash: await hashPassword('Password123'), role: 'staf', status: 'aktif', ...over,
  });
}

const cookieOf = (res) => res.headers['set-cookie']?.find((c) => c.startsWith('token='));

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});
after(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});
beforeEach(async () => {
  await Promise.all([User.deleteMany({}), BusinessProfile.deleteMany({})]);
});

describe('POST /auth/register', () => {
  it('membuat akun menunggu_persetujuan, profil usaha, dan auto-login', async () => {
    const res = await request(app).post(`${API}/auth/register`).send(payload());
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.status, 'menunggu_persetujuan');
    assert.equal(res.body.data.role, 'umkm');
    assert.equal(res.body.data.business.nib, '1234567890123');
    assert.ok(cookieOf(res), 'cookie token harus diset');
    assert.match(cookieOf(res), /HttpOnly/i);
    assert.equal(JSON.stringify(res.body).includes('passwordHash'), false);
    const stored = await User.findOne({ email: 'entin@example.com' }).select('+passwordHash');
    assert.notEqual(stored.passwordHash, 'Password123');
  });

  it('menolak NIB bukan 13 digit dengan pesan per field (422)', async () => {
    const res = await request(app).post(`${API}/auth/register`).send(payload({ nib: '123' }));
    assert.equal(res.status, 422);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
    assert.equal(res.body.error.fields.nib, 'NIB harus 13 digit angka');
  });

  it('menolak email & NIB ganda (409) dengan fields', async () => {
    await request(app).post(`${API}/auth/register`).send(payload());
    const res = await request(app).post(`${API}/auth/register`).send(payload());
    assert.equal(res.status, 409);
    assert.equal(res.body.error.fields.email, 'Email sudah terdaftar');
    assert.equal(res.body.error.fields.nib, 'NIB sudah terdaftar');
  });

  it('memvalidasi kata sandi, kecamatan, dan pernyataan', async () => {
    const res = await request(app).post(`${API}/auth/register`).send(
      payload({ password: 'abc', konfirmasiPassword: 'abc', kecamatan: 'Bandung', pernyataanBenar: false }),
    );
    assert.equal(res.status, 422);
    assert.ok(res.body.error.fields.password);
    assert.ok(res.body.error.fields.kecamatan);
    assert.ok(res.body.error.fields.pernyataanBenar);
  });
});

describe('POST /auth/login', () => {
  beforeEach(async () => {
    await request(app).post(`${API}/auth/register`).send(payload());
  });

  it('login dengan email', async () => {
    const res = await request(app).post(`${API}/auth/login`).send({ identifier: 'ENTIN@example.com', password: 'Password123' });
    assert.equal(res.status, 200);
    assert.ok(cookieOf(res));
  });

  it('login dengan NIB 13 digit', async () => {
    const res = await request(app).post(`${API}/auth/login`).send({ identifier: '1234567890123', password: 'Password123' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.email, 'entin@example.com');
  });

  it('pesan gagal sama untuk akun tidak ada dan sandi salah', async () => {
    const a = await request(app).post(`${API}/auth/login`).send({ identifier: 'entin@example.com', password: 'salah12345' });
    const b = await request(app).post(`${API}/auth/login`).send({ identifier: 'tidakada@example.com', password: 'salah12345' });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(a.body.error.message, 'Email/NIB atau kata sandi salah');
    assert.equal(a.body.error.message, b.body.error.message);
  });

  it('akun nonaktif tidak bisa login (403)', async () => {
    await User.updateOne({ email: 'entin@example.com' }, { status: 'nonaktif' });
    const res = await request(app).post(`${API}/auth/login`).send({ identifier: 'entin@example.com', password: 'Password123' });
    assert.equal(res.status, 403);
    assert.equal(res.body.error.message, 'Akun dinonaktifkan, hubungi dinas.');
  });

  it('memblokir setelah 5 percobaan gagal (429), kombinasi lain tidak terdampak', async () => {
    const body = { identifier: 'brute@example.com', password: 'salah12345' };
    for (let i = 0; i < 5; i += 1) {
      const r = await request(app).post(`${API}/auth/login`).send(body);
      assert.equal(r.status, 401);
    }
    const blocked = await request(app).post(`${API}/auth/login`).send(body);
    assert.equal(blocked.status, 429);
    assert.equal(blocked.body.error.code, 'RATE_LIMITED');
    const other = await request(app).post(`${API}/auth/login`).send({ identifier: 'entin@example.com', password: 'Password123' });
    assert.equal(other.status, 200);
  });

  it('login gagal tercatat di audit log', async () => {
    await request(app).post(`${API}/auth/login`).send({ identifier: 'audit@example.com', password: 'salah12345' });
    assert.ok(await AuditLog.exists({ action: 'auth.login_gagal', 'meta.identifier': 'audit@example.com' }));
  });
});

describe('sesi, RBAC, dan logout', () => {
  it('GET /auth/me butuh login (401) dan mengembalikan user + profil', async () => {
    assert.equal((await request(app).get(`${API}/auth/me`)).status, 401);
    const agent = request.agent(app);
    await agent.post(`${API}/auth/register`).send(payload({ email: 'me@example.com', nib: '1111111111111' }));
    const res = await agent.get(`${API}/auth/me`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.business.namaUsaha, 'KUB Aren Jaya');
  });

  it('authorize: staf lolos, umkm 403; kabid mewarisi staf', async () => {
    const { default: express } = await import('express');
    const { default: cookieParser } = await import('cookie-parser');
    const { authenticate } = await import('../src/middleware/authenticate.js');
    const { authorize } = await import('../src/middleware/authorize.js');
    const { errorHandler } = await import('../src/middleware/errorHandler.js');
    const mini = express();
    mini.use(cookieParser());
    mini.get('/staf', authenticate, authorize('staf'), (req, res) => res.json({ ok: true }));
    mini.get('/kabid', authenticate, authorize('kabid'), (req, res) => res.json({ ok: true }));
    mini.use(errorHandler);

    await makeUser({ email: 'staf@example.com', role: 'staf' });
    await makeUser({ email: 'kabid@example.com', role: 'kabid' });
    await makeUser({ email: 'umkm@example.com', role: 'umkm' });

    const login = async (email) => {
      const r = await request(app).post(`${API}/auth/login`).send({ identifier: email, password: 'Password123' });
      return cookieOf(r);
    };
    const [cStaf, cKabid, cUmkm] = await Promise.all([login('staf@example.com'), login('kabid@example.com'), login('umkm@example.com')]);

    assert.equal((await request(mini).get('/staf').set('Cookie', cStaf)).status, 200);
    assert.equal((await request(mini).get('/staf').set('Cookie', cKabid)).status, 200);
    assert.equal((await request(mini).get('/staf').set('Cookie', cUmkm)).status, 403);
    assert.equal((await request(mini).get('/kabid').set('Cookie', cStaf)).status, 403);
    assert.equal((await request(mini).get('/kabid').set('Cookie', cKabid)).status, 200);
    assert.equal((await request(mini).get('/staf')).status, 401);
  });

  it('akun yang dinonaktifkan langsung terputus walau token masih valid', async () => {
    const agent = request.agent(app);
    await agent.post(`${API}/auth/register`).send(payload({ email: 'cut@example.com', nib: '2222222222222' }));
    await User.updateOne({ email: 'cut@example.com' }, { status: 'nonaktif' });
    assert.equal((await agent.get(`${API}/auth/me`)).status, 403);
  });

  it('logout menghapus cookie', async () => {
    const agent = request.agent(app);
    await agent.post(`${API}/auth/register`).send(payload({ email: 'out@example.com', nib: '3333333333333' }));
    const res = await agent.post(`${API}/auth/logout`);
    assert.equal(res.status, 200);
    assert.equal((await agent.get(`${API}/auth/me`)).status, 401);
  });

  it('mustChangePassword memblokir halaman lain sampai sandi diganti', async () => {
    await makeUser({ email: 'baru@example.com', role: 'umkm', mustChangePassword: true });
    const agent = request.agent(app);
    await agent.post(`${API}/auth/login`).send({ identifier: 'baru@example.com', password: 'Password123' });
    const blocked = await agent.get(`${API}/profil/saya`);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.body.error.code, 'MUST_CHANGE_PASSWORD');
    const change = await agent.post(`${API}/auth/change-password`).send({ currentPassword: 'Password123', newPassword: 'SandiBaru456' });
    assert.equal(change.status, 200);
    assert.equal((await User.findOne({ email: 'baru@example.com' })).mustChangePassword, false);
  });
});

describe('lupa & ganti sandi', () => {
  it('reset sandi: token sekali pakai dan hash tersimpan', async () => {
    await makeUser({ email: 'lupa@example.com', role: 'staf' });
    const { sendMail } = await import('../src/utils/mailer.js');
    assert.equal(typeof sendMail, 'function');

    const res = await request(app).post(`${API}/auth/forgot-password`).send({ email: 'lupa@example.com' });
    assert.equal(res.status, 200);
    const unknown = await request(app).post(`${API}/auth/forgot-password`).send({ email: 'tidak.ada@example.com' });
    assert.equal(unknown.status, 200); // tidak membocorkan keberadaan akun

    const user = await User.findOne({ email: 'lupa@example.com' }).select('+resetTokenHash +resetExpires');
    assert.ok(user.resetTokenHash && user.resetExpires > new Date());

    // Token mentah tidak disimpan: buat token dikenal dengan hash-nya untuk menguji alur reset.
    const crypto = await import('node:crypto');
    const token = 'a'.repeat(64);
    user.resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');
    await user.save();

    const ok = await request(app).post(`${API}/auth/reset-password`).send({ token, password: 'SandiBaru456' });
    assert.equal(ok.status, 200);
    const again = await request(app).post(`${API}/auth/reset-password`).send({ token, password: 'LainLagi789' });
    assert.equal(again.status, 422);
    const login = await request(app).post(`${API}/auth/login`).send({ identifier: 'lupa@example.com', password: 'SandiBaru456' });
    assert.equal(login.status, 200);
  });

  it('token reset kedaluwarsa ditolak', async () => {
    const crypto = await import('node:crypto');
    const token = 'b'.repeat(64);
    await makeUser({
      email: 'exp@example.com',
      resetTokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      resetExpires: new Date(Date.now() - 1000),
    });
    const res = await request(app).post(`${API}/auth/reset-password`).send({ token, password: 'SandiBaru456' });
    assert.equal(res.status, 422);
  });
});

describe('profil usaha', () => {
  it('UMKM boleh ubah profil tetapi NIB diabaikan; non-UMKM 403', async () => {
    const agent = request.agent(app);
    await agent.post(`${API}/auth/register`).send(payload({ email: 'prof@example.com', nib: '4444444444444' }));
    const res = await agent.put(`${API}/profil/saya`).send({ namaUsaha: 'Nama Baru Usaha', nib: '9999999999999' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.namaUsaha, 'Nama Baru Usaha');
    assert.equal(res.body.data.nib, '4444444444444');

    const bad = await agent.put(`${API}/profil/saya`).send({ kecamatan: 'Jakarta' });
    assert.equal(bad.status, 422);

    await makeUser({ email: 'staf2@example.com', role: 'staf' });
    const staf = request.agent(app);
    await staf.post(`${API}/auth/login`).send({ identifier: 'staf2@example.com', password: 'Password123' });
    assert.equal((await staf.get(`${API}/profil/saya`)).status, 403);
  });
});

describe('PBI-06: Pendaftaran UMKM Manual & Ajukan Ulang Akun [Naila]', () => {
  it('AC-06-09: Staf mendaftarkan UMKM manual lapangan -> akun langsung aktif dengan temporary password', async () => {
    await makeUser({ email: 'staf-manual@example.com', role: 'staf' });
    const staf = request.agent(app);
    await staf.post(`${API}/auth/login`).send({ identifier: 'staf-manual@example.com', password: 'Password123' });

    const manualData = {
      nama: 'Pak Jaja Kanekes',
      email: 'jaja.baduy@example.com',
      noHp: '081298765432',
      namaUsaha: 'Tenun Baduy Jaja Indah',
      kecamatan: 'Leuwidamar',
      kategoriUtama: 'kriya_tenun',
      subKomoditas: 'Tenun Baduy',
      nib: '8888777766665',
      alamat: 'Kp. Gazebo Desa Kanekes',
    };

    const res = await staf.post(`${API}/umkm/manual`).send(manualData);
    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.status, 'aktif');
    assert.equal(res.body.data.user.email, 'jaja.baduy@example.com');
    assert.ok(res.body.data.temporaryPassword);
    assert.equal(res.body.data.temporaryPassword.length >= 10, true);

    // Login menggunakan kata sandi sementara yang diterbitkan dinas
    const umkmAgent = request.agent(app);
    const loginRes = await umkmAgent.post(`${API}/auth/login`).send({
      identifier: 'jaja.baduy@example.com',
      password: res.body.data.temporaryPassword,
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.data.mustChangePassword, true);
  });

  it('AC-06-07: UMKM yang ditolak dinas dapat mengajukan ulang verifikasi', async () => {
    const umkmUser = await makeUser({
      email: 'umkm-revisi@example.com',
      role: 'umkm',
      status: 'ditolak',
      catatanStatus: 'NIB tidak terbaca jelas',
    });
    await BusinessProfile.create({
      userId: umkmUser._id,
      namaUsaha: 'Usaha Revisi Jaya',
      kecamatan: 'Rangkasbitung',
      alamat: 'Jl. Multatuli No. 10, Rangkasbitung',
      kategoriUtama: 'olahan_pangan',
      waUsaha: '081234567890',
      nib: '1234567890123',
    });

    const umkmAgent = request.agent(app);
    await umkmAgent.post(`${API}/auth/login`).send({
      identifier: 'umkm-revisi@example.com',
      password: 'Password123',
    });

    const res = await umkmAgent.post(`${API}/profil/saya/ajukan-ulang`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.status, 'menunggu_persetujuan');

    // Cek status user setelah ajukan ulang
    const meRes = await umkmAgent.get(`${API}/auth/me`);
    assert.equal(meRes.body.data.status, 'menunggu_persetujuan');
    assert.equal(meRes.body.data.catatanStatus, null);
  });
});
