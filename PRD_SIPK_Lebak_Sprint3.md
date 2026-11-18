# Product Requirements Document (PRD)
## SIPK-Lebak — Sprint 3: Event, Forum, Sintesa, Dasbor, dan Manajemen Akun

**Versi:** 1.0  
**Kelompok:** Capstone Design Project, S1 Sistem Informasi, Telkom University  
**Tim:** Naila Hafidz Bachtiar, Muhammad Fariz Eka Putra, Abdullah Muchtar Rasyid  
**Jadwal:** mengikuti jadwal acuan tim (lihat PRD Sprint 1, keputusan K-09)

> PRD ini melanjutkan **PRD Sprint 1** dan **PRD Sprint 2**. Seksi 4 PRD Sprint 1 (struktur proyek, konvensi API, enum, middleware, penomoran, audit log, kepemilikan file, aturan git) tetap berlaku. Ringkasan yang dibutuhkan ada di Seksi 3.

---

## 1. Ringkasan Sprint

Sprint 3 melengkapi layanan dinas dan komunitas serta pemantauan: **pameran dan pelatihan** (event), **forum komunitas**, **layanan kemasan Sintesa**, **dasbor analitik**, dan **manajemen akun**.

**Aktor (tetap 4):** `umkm`, `staf`, `kabid`, `mitra`. Peran Konsultan PLUT yang ada di draf lama dilebur ke `staf` (ia mengelola jadwal konsultasi dan menandai jawaban resmi di forum). Pengelolaan akun dilakukan `kabid`.

**Prasyarat dari Sprint 1 dan 2 (sudah nyata):** akun dan RBAC, profil usaha, dokumen, produk terkurasi, RFQ dan alokasi, PO.

---

## 2. Scope Sprint 3

Sprint 3 mencakup **FR-09 sampai FR-13** (20 SP dari proposal).

| PBI | Nama Fitur | FR | PIC (usulan) | SP |
|-----|-----------|----|--------------|----|
| PBI-12 | Event daerah dan pendaftaran stan | FR-09 | Fariz | 5 |
| PBI-13 | Forum komunitas | FR-10 | Abdullah | 5 |
| PBI-14 | Layanan kemasan Sintesa | FR-11 | Fariz | 3 |
| PBI-15 | Dasbor analitik dinas dan dasbor UMKM | FR-12 | Naila | 5 |
| PBI-16 | Manajemen akun, matriks hak akses, log audit | FR-13 | Abdullah | 2 |

Beban: Naila 5 SP, Fariz 8 SP, Abdullah 7 SP. Naila lebih ringan karena dasbor membaca data semua modul sehingga butuh waktu integrasi dan perbaikan dari hasil UAT.

---

## 3. Ringkasan Kontrak Bersama (dari PRD Sprint 1)

- Prefix API `/api/v1`; format sukses `{ success, data, message }`; gagal `{ success:false, error:{ code, message, fields } }`; paginasi `{ items, pagination }`.
- Role: `umkm`, `staf`, `kabid`, `mitra`; `authorize('staf')` meloloskan `kabid`.
- `requireActiveUmkm` untuk aksi yang mensyaratkan akun UMKM `aktif`.
- `generateCode` untuk nomor Sintesa `SIN-{tahun}-{seq3}` dan ID kemitraan `MTR-{tahun}-{seq4}`.
- `auditLog.write(...)` wajib untuk perubahan penting.
- Kepemilikan file dijaga per PBI (3.1).

### 3.1 Kepemilikan file Sprint 3

| Area | Pemilik |
|------|---------|
| `modules/events/*`, `models/Event.js`, `models/EventRegistration.js`, `pages/dinas/event/*`, `pages/umkm/event/*` | Fariz |
| `modules/sintesa/*`, `models/SintesaRequest.js`, `models/SintesaQuota.js`, `pages/dinas/sintesa/*`, `pages/umkm/sintesa/*` | Fariz |
| `modules/forum/*`, `models/ForumThread.js`, `models/ForumPost.js`, `pages/forum/*` | Abdullah |
| `modules/accounts/*`, `pages/dinas/akun/*`, `pages/dinas/audit/*` | Abdullah |
| `modules/dashboard/*`, `pages/dinas/dasbor/*`, `pages/umkm/dasbor/*` | Naila |

### 3.2 Kontrak antar-PBI Sprint 3

| Disediakan oleh | Nama | Dipakai oleh | Keterangan |
|-----------------|------|--------------|------------|
| Fariz (PBI-12) | Model `Event`, `EventRegistration` | Naila (PBI-15) | Dasbor menampilkan agenda terdekat dan jumlah pendaftar |
| Fariz (PBI-14) | Model `SintesaRequest`, `SintesaQuota` | Naila (PBI-15) | Dasbor menampilkan antrean dan sisa kuota |
| Abdullah (PBI-13) | Model `ForumThread` | Naila (PBI-15) | Dasbor menampilkan thread terbaru |
| Abdullah (PBI-16) | `accountService.createUser({ nama, email, noHp, role })` | Fariz, Naila (hanya baca) | Membuat akun staf atau mitra |
| Naila (PBI-15) | `dashboardService.getDinasKpi()`, `getUmkmSummary(businessId)` | Naila | Satu pemilik |
| Naila | `menuConfig.js` | Semua | Semua menu Sprint 3 sudah ada dan diaktifkan dengan mengubah `enabled: true` oleh pemilik PBI yang bersangkutan (perubahan satu baris, tidak perlu persetujuan) |

---

## 4. Dependensi dan Dummy Data Sprint 3

Seeder Sprint 3 dijalankan setelah seeder Sprint 1 dan 2 (`npm run seed`).

### 4.1 Seed event (`seeders/eventSeeder.js`, Fariz)

| Nama | Jenis | Lokasi | Tanggal | Kuota | Terisi | Syarat kurasi | Status |
|------|-------|--------|---------|-------|--------|---------------|--------|
| Pameran Hari Koperasi (Harkop) Kab. Lebak 2026 | pameran | Alun-Alun Rangkasbitung | 12 sampai 14 Des 2026 | 30 | 25 | Ya | `dibuka` |
| Gelar Produk Hari UMKM Nasional Tingkat Kabupaten | pameran | Plaza Lebak | 20 sampai 22 Des 2026 | 20 | 20 | Ya | `dibuka` (penuh, otomatis ditutup) |
| Pelatihan Kurasi Kemasan dan Sertifikasi Halal (2 hari) | pelatihan | Aula Diskop UKM Lebak | 28 sampai 29 Des 2026 | 35 | 28 | Tidak | `dibuka` |

### 4.2 Seed Sintesa (`seeders/sintesaSeeder.js`, Fariz)

- `SintesaQuota` tahun berjalan: `total = 100`, `terpakai = 58` (sisa 42).
- 4 pengajuan contoh: `diajukan`, `dijadwalkan` (19 November 2026 09.00 WIB), `desain_dikerjakan`, `selesai`.

### 4.3 Seed forum (`seeders/forumSeeder.js`, Abdullah)

- 1 thread disematkan "Panduan Lengkap Syarat Kurasi Masuk Ritel Alfamart, Plaza Lebak, dan Pendaftaran Kemasan Gratis Sintesa" (kategori `pengumuman_dinas`, penulis `kabid`).
- 1 thread tanya jawab "Cara mengurus perpanjangan Sertifikat Halal dan uji umur simpan untuk produk gula semut dan keripik pisang di Lebak?" (kategori `legalitas_perizinan`) dengan 6 balasan, 1 di antaranya jawaban resmi dinas.
- 1 thread kolaborasi pasokan "Informasi pemasok benang katun tenun kualitas halus untuk RFQ 100 lembar kain Baduy" (kategori `bahan_baku`, 15 balasan).

### 4.4 Seed akun tambahan (Abdullah)

Tidak ada tambahan; manajemen akun diuji dengan seed user Sprint 1 dan 2 (7 sampai 9 akun) ditambah akun `mitra` kedua `ritel@alfamart-dummy.example` dengan `MTR-2026-0002`.

---

## 5. PBI-12 — Event Daerah dan Pendaftaran Stan (FR-09)

**PIC:** Fariz | **SP:** 5 | **Aktor:** `staf`, `kabid` (kelola), `umkm` (mendaftar)

### 5.1 User Story

> **Sebagai** staf dinas, **saya ingin** mengumumkan jadwal pameran dan pelatihan dan menerima pendaftaran secara daring,  
> **agar** informasi tidak hanya bergantung pada Instagram.

> **Sebagai** pelaku UMKM, **saya ingin** melihat jadwal event dan mendaftar stan lewat aplikasi,  
> **agar** saya tidak ketinggalan kesempatan pameran.

### 5.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-12-01 | Staf membuat event: nama, jenis (pameran atau pelatihan), deskripsi, lokasi, tanggal mulai dan selesai, kuota peserta/stan, tenggat pendaftaran, syarat produk terkurasi (ya atau tidak) | Semua field tervalidasi |
| AC-12-02 | Event dibuat sebagai `draf`; staf menekan "Publikasikan" untuk mengubah menjadi `dibuka` | Hanya event `dibuka` terlihat UMKM |
| AC-12-03 | Halaman "Event Daerah" untuk UMKM menampilkan kartu event: nama, lokasi, tanggal, kuota terisi/total, tenggat, tombol status | Urut tanggal terdekat |
| AC-12-04 | Tombol "Daftar Stan" aktif hanya jika: akun `aktif`, event `dibuka`, tenggat belum lewat, kuota belum penuh, dan (jika disyaratkan) UMKM punya produk `terkurasi` | Jika tidak, tombol nonaktif dengan alasan singkat |
| AC-12-05 | Event penuh otomatis berstatus tampil "Pendaftaran Ditutup" (tombol nonaktif) | Kuota 20/20 menutup pendaftaran |
| AC-12-06 | Pendaftaran bersifat **atomik**: dua UMKM mendaftar pada kursi terakhir hanya satu yang berhasil | Diuji dengan request bersamaan |
| AC-12-07 | Satu UMKM hanya boleh terdaftar sekali per event (kecuali yang sebelumnya dibatalkan atau ditolak) | Pendaftaran ganda 409 |
| AC-12-08 | Pendaftaran baru berstatus `menunggu_verifikasi`; staf memverifikasi (`disetujui` atau `ditolak` dengan catatan) | Status terlihat oleh UMKM |
| AC-12-09 | Pendaftaran yang ditolak atau dibatalkan mengembalikan kursi | Kuota terisi berkurang |
| AC-12-10 | UMKM dapat membatalkan pendaftaran selama event belum dimulai | Setelah dimulai 409 |
| AC-12-11 | UMKM melihat riwayat partisipasi (event yang diikuti dan statusnya) | Tab "Riwayat" |
| AC-12-12 | Staf melihat tabel peserta per event (nama usaha, kecamatan, produk, status) dan dapat mengekspor rekap peserta ke Excel | Berkas `.xlsx` terunduh |
| AC-12-13 | Staf dapat mengubah event (kuota tidak boleh diturunkan di bawah jumlah terisi) dan menutup event secara manual | Validasi kuota |
| AC-12-14 | Event dapat dilihat publik tanpa login (hanya event `dibuka`, tanpa data peserta) | Satu halaman publik "Jadwal Event" |

### 5.3 Logika

**Kursi atomik:**
```js
const ev = await Event.findOneAndUpdate(
  { _id: eventId, status: 'dibuka', tenggatDaftar: { $gt: new Date() },
    $expr: { $lt: ['$terisi', '$kuota'] } },
  { $inc: { terisi: 1 } },
  { new: true }
);
if (!ev) throw new AppError('Pendaftaran sudah ditutup atau kuota penuh', 409);
try {
  await EventRegistration.create({ eventId, businessId, userId, productId, status: 'menunggu_verifikasi' });
} catch (e) {
  await Event.updateOne({ _id: eventId }, { $inc: { terisi: -1 } });   // kompensasi
  throw e;                                                             // duplikat -> 409
}
```

`terisi` menghitung pendaftaran berstatus `menunggu_verifikasi` dan `disetujui` (agar tidak melebihi kuota saat menunggu verifikasi). Tolak atau batal memanggil `$inc: { terisi: -1 }`.

**Status tampilan event (dihitung, tidak disimpan):**

| Kondisi | Tampilan |
|---------|----------|
| `status = dibuka` dan `terisi < kuota` dan tenggat belum lewat | "Buka Pendaftaran" |
| `terisi >= kuota` | "Pendaftaran Ditutup (Penuh)" |
| tenggat lewat | "Pendaftaran Ditutup" |
| tanggal selesai lewat | "Selesai" |

**Syarat kurasi:** jika `syaratKurasi = true`, cek `Product.exists({ businessId, statusKurasi: 'terkurasi' })`.

### 5.4 Skema Database

```js
// models/Event.js
{
  nama: String (required, 5..150),
  jenis: { type: String, enum: ['pameran','pelatihan'], required: true },
  deskripsi: String,
  lokasi: String (required),
  tanggalMulai: Date (required), tanggalSelesai: Date (required),
  kuota: { type: Number, required: true, min: 1 },
  terisi: { type: Number, default: 0, min: 0 },
  tenggatDaftar: Date (required),
  syaratKurasi: { type: Boolean, default: false },
  status: { type: String, enum: ['draf','dibuka','ditutup'], default: 'draf', index: true },
  createdBy: ObjectId (ref User),
  timestamps: true
}

// models/EventRegistration.js
{
  eventId: ObjectId (ref Event, required, index),
  businessId: ObjectId (ref BusinessProfile, required),
  userId: ObjectId (ref User, required),
  productId: ObjectId (ref Product),                       // produk yang dipamerkan (opsional untuk pelatihan)
  status: { type: String, enum: ['menunggu_verifikasi','disetujui','ditolak','dibatalkan'],
            default: 'menunggu_verifikasi' },
  catatan: String, verifiedBy: ObjectId, verifiedAt: Date,
  timestamps: true
}
// index unik parsial: { eventId: 1, businessId: 1 } where status in ['menunggu_verifikasi','disetujui']
```

### 5.5 Endpoint

```
GET    /events                          login(umkm,staf,kabid)  ?status=&jenis=   (umkm hanya dibuka)
GET    /events/publik                   publik                  -> jadwal event dibuka
GET    /events/:id                      login
POST   /events                          staf, kabid
PUT    /events/:id                      staf, kabid
POST   /events/:id/publikasi            staf, kabid
POST   /events/:id/tutup                staf, kabid
POST   /events/:id/daftar               umkm (requireActiveUmkm)    body: { productId? }
DELETE /events/:id/daftar               umkm (batalkan pendaftaran sendiri)
GET    /events/riwayat/saya             umkm
GET    /events/:id/peserta              staf, kabid
PATCH  /events/:id/peserta/:regId       staf, kabid   body: { keputusan: 'setuju'|'tolak', catatan }
GET    /events/:id/peserta/export       staf, kabid   -> .xlsx
```

### 5.6 Validasi

```js
tanggalMulai: >= hari ini ; tanggalSelesai: >= tanggalMulai
tenggatDaftar: <= tanggalMulai
kuota: z.number().int().min(1).max(1000)
nama: z.string().min(5).max(150)
```

---

## 6. PBI-13 — Forum Komunitas (FR-10)

**PIC:** Abdullah | **SP:** 5 | **Aktor:** `umkm`, `staf`, `kabid`

### 6.1 User Story

> **Sebagai** pelaku UMKM, **saya ingin** bertanya dan berbagi pengalaman soal izin, kemasan, dan bahan baku dengan sesama UMKM dan dinas,  
> **agar** saya tidak harus datang ke pelatihan tatap muka untuk mendapat jawaban.

### 6.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-13-01 | Daftar thread menampilkan judul, kategori (badge teks), penulis, kecamatan, jumlah balasan, aktivitas terakhir | Urut: disematkan dulu, lalu aktivitas terbaru |
| AC-13-02 | Kategori: `pengumuman_dinas`, `legalitas_perizinan`, `kemasan`, `bahan_baku`, `kolaborasi_pasokan`, `umum` | Filter kategori berfungsi |
| AC-13-03 | Filter wilayah berdasarkan kecamatan penulis dan pencarian judul | Hasil sesuai |
| AC-13-04 | `umkm` (akun `aktif`) dapat membuat thread dan membalas; kategori `pengumuman_dinas` hanya untuk `staf`/`kabid` | UMKM memilih kategori ini: 403 |
| AC-13-05 | `mitra` tidak punya akses forum | 403, menu tidak tampil |
| AC-13-06 | `staf`/`kabid` dapat **menyematkan** thread (maksimal 3 sekaligus) dan thread tersemat berborder navy dengan label "Disematkan" | Penyematan ke-4 ditolak dengan pesan |
| AC-13-07 | `staf`/`kabid` dapat menandai satu balasan sebagai **Jawaban Resmi Dinas**; thread mendapat penanda "Terjawab oleh Dinas" | Penanda tampil di daftar dan detail |
| AC-13-08 | `staf`/`kabid` dapat menyembunyikan thread atau balasan yang melanggar (moderasi) dengan alasan; isi diganti "Dihapus moderator" | Tercatat di audit log |
| AC-13-09 | Penulis dapat menyunting thread/balasan miliknya dalam 15 menit setelah dibuat dan menghapus miliknya | Setelah 15 menit tombol edit hilang |
| AC-13-10 | Detail thread: isi topik, daftar balasan (avatar inisial, nama usaha, kecamatan, waktu), kolom balasan | Balasan urut waktu naik |
| AC-13-11 | Peran penulis ditampilkan (label "Dinas" untuk `staf`/`kabid`) | Label jelas |
| AC-13-12 | Batas: judul 10 sampai 150 karakter, isi 20 sampai 3000, balasan 2 sampai 2000; teks dibersihkan dari HTML | Input mengandung `<script>` tidak dieksekusi |
| AC-13-13 | UMKM yang akunnya belum `aktif` dapat membaca tetapi tidak menulis | Form nonaktif dengan penjelasan |
| AC-13-14 | Pembatasan laju: maksimal 10 postingan per 10 menit per pengguna | 429 |

### 6.3 Logika

- `replyCount` dan `lastActivityAt` diperbarui dengan `$inc` / `$set` saat balasan dibuat atau disembunyikan.
- Penyematan: `ForumThread.countDocuments({ pinned: true })` harus kurang dari 3 sebelum menyematkan; pengecekan dilakukan dalam satu `findOneAndUpdate` bersyarat untuk menghindari balapan.
- Jawaban resmi: hanya balasan yang ditulis oleh `staf`/`kabid` boleh ditandai; satu thread satu jawaban resmi (menandai yang baru menggantikan yang lama).
- Sanitasi: simpan teks polos; render di frontend sebagai teks (React meng-escape otomatis), baris baru dipertahankan. Jangan memakai `dangerouslySetInnerHTML`.

### 6.4 Skema Database

```js
// models/ForumThread.js
{
  judul: String (required, 10..150),
  isi: String (required, 20..3000),
  kategori: { type: String, required: true, index: true,
              enum: ['pengumuman_dinas','legalitas_perizinan','kemasan','bahan_baku','kolaborasi_pasokan','umum'] },
  authorId: ObjectId (ref User, required),
  authorRole: String, authorNama: String, authorKecamatan: String,   // snapshot untuk tampilan cepat
  pinned: { type: Boolean, default: false, index: true },
  pinnedBy: ObjectId, pinnedAt: Date,
  terjawabDinas: { type: Boolean, default: false },
  jawabanResmiPostId: ObjectId (ref ForumPost),
  status: { type: String, enum: ['aktif','disembunyikan'], default: 'aktif' },
  replyCount: { type: Number, default: 0 },
  lastActivityAt: { type: Date, default: Date.now, index: true },
  timestamps: true
}

// models/ForumPost.js
{
  threadId: ObjectId (ref ForumThread, required, index),
  authorId: ObjectId (ref User, required),
  authorRole: String, authorNama: String, authorKecamatan: String,
  isi: String (required, 2..2000),
  jawabanResmi: { type: Boolean, default: false },
  status: { type: String, enum: ['aktif','disembunyikan'], default: 'aktif' },
  alasanModerasi: String, moderatedBy: ObjectId,
  timestamps: true
}
```

### 6.5 Endpoint

```
GET    /forum/threads                    umkm, staf, kabid   ?kategori=&kecamatan=&q=&page=
POST   /forum/threads                    umkm(aktif), staf, kabid
GET    /forum/threads/:id                umkm, staf, kabid   -> thread + balasan
PUT    /forum/threads/:id                penulis (15 menit)
DELETE /forum/threads/:id                penulis
POST   /forum/threads/:id/posts          umkm(aktif), staf, kabid
PUT    /forum/posts/:id                  penulis (15 menit)
DELETE /forum/posts/:id                  penulis
POST   /forum/threads/:id/sematkan       staf, kabid
POST   /forum/threads/:id/lepas-sematan  staf, kabid
POST   /forum/posts/:id/jawaban-resmi    staf, kabid
POST   /forum/threads/:id/sembunyikan    staf, kabid   body: { alasan }
POST   /forum/posts/:id/sembunyikan      staf, kabid   body: { alasan }
```

---

## 7. PBI-14 — Layanan Kemasan Sintesa (FR-11)

**PIC:** Fariz | **SP:** 3 | **Aktor:** `umkm` (mengajukan), `staf`, `kabid` (mengelola)

### 7.1 User Story

> **Sebagai** pelaku UMKM, **saya ingin** mengajukan layanan desain kemasan gratis Sintesa lewat aplikasi dan memantau jadwal serta statusnya,  
> **agar** saya tidak perlu datang ke kantor dinas hanya untuk mendaftar.

### 7.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-14-01 | Pengajuan hanya untuk produk berstatus `terkurasi` **dan** UMKM punya dokumen NIB berstatus `valid` | Jika tidak, form menampilkan syarat yang belum terpenuhi |
| AC-14-02 | Form: pilih produk, jenis fasilitasi (desain kemasan, desain label, keduanya), kondisi kemasan saat ini, target pasar, unggah foto kemasan eksisting (maksimal 3), usulan tanggal konsultasi | Semua field tervalidasi |
| AC-14-03 | Gratis untuk **satu komoditas (produk) per tahun** per UMKM | Pengajuan kedua pada tahun yang sama 409 (kecuali yang sebelumnya `ditolak` atau `dibatalkan`) |
| AC-14-04 | Kartu "Kuota Subsidi Cetak" menampilkan sisa dari total (contoh 42 dari 100 paket) | Angka dari `SintesaQuota` tahun berjalan |
| AC-14-05 | Usulan tanggal konsultasi minimal 3 hari kerja dari hari ini dan hari kerja (Senin sampai Jumat) | Validasi tanggal |
| AC-14-06 | Setelah diajukan, UMKM melihat timeline vertikal: Diajukan, Dijadwalkan, Desain Dikerjakan, Selesai; tahap aktif disorot | Timeline mengikuti status |
| AC-14-07 | Staf melihat antrean pengajuan dengan tombol "Atur Jadwal"; mengatur jadwal final mengubah status ke `dijadwalkan` | Jadwal final tampil di sisi UMKM |
| AC-14-08 | Staf menetapkan nama desainer/konsultan dan mengubah status ke `desain_dikerjakan`; saat itu kuota subsidi cetak berkurang 1 paket secara atomik | Jika kuota habis, perubahan ditolak dengan pesan |
| AC-14-09 | Staf menandai `selesai` setelah desain disetujui UMKM (ACC cetak) dan dapat mencatat catatan hasil | Status akhir tersimpan |
| AC-14-10 | Staf dapat menolak pengajuan dengan alasan (mis. produk tidak memenuhi syarat); kuota tidak berkurang | Alasan terlihat UMKM |
| AC-14-11 | UMKM dapat membatalkan pengajuan selama status `diajukan` atau `dijadwalkan` | Setelah desain dikerjakan tidak bisa dibatalkan |
| AC-14-12 | Setiap perubahan status tercatat di `timeline` dengan waktu dan pelaku | Riwayat lengkap |
| AC-14-13 | Foto kemasan dikompres seperti foto produk (di bawah 300 KB) | Ukuran sesuai |

### 7.3 Logika

**State machine Sintesa:**
```
diajukan --[staf: atur jadwal]--> dijadwalkan
dijadwalkan --[staf: tetapkan desainer]--> desain_dikerjakan     (kuota cetak -1, atomik)
desain_dikerjakan --[staf: tandai selesai]--> selesai
diajukan/dijadwalkan --[umkm: batalkan]--> dibatalkan
diajukan/dijadwalkan --[staf: tolak]--> ditolak
```

**Kuota subsidi cetak atomik:**
```js
const q = await SintesaQuota.findOneAndUpdate(
  { tahun, $expr: { $lt: ['$terpakai', '$total'] } },
  { $inc: { terpakai: 1 } },
  { new: true }
);
if (!q) throw new AppError('Kuota subsidi cetak tahun ini sudah habis', 409);
// lanjut mengubah status; jika gagal, $inc: { terpakai: -1 }
```

**Batas satu per tahun:** `SintesaRequest.exists({ businessId, tahun, status: { $nin: ['ditolak','dibatalkan'] } })`.

### 7.4 Skema Database

```js
// models/SintesaRequest.js
{
  kode: { type: String, unique: true },                 // SIN-2026-007
  businessId: ObjectId (ref BusinessProfile, required, index),
  productId: ObjectId (ref Product, required),
  tahun: { type: Number, required: true },
  jenisFasilitasi: { type: String, enum: ['desain_kemasan','desain_label','keduanya'], required: true },
  kondisiKemasan: String (required),
  targetPasar: String (required),
  fotoKemasan: [{ path: String, ukuran: Number }],
  usulanJadwal: { type: Date, required: true },
  jadwalFinal: Date,
  desainerNama: String,
  status: { type: String, default: 'diajukan', index: true,
            enum: ['diajukan','dijadwalkan','desain_dikerjakan','selesai','ditolak','dibatalkan'] },
  alasanTolak: String, catatanHasil: String,
  timeline: [{ at: Date, oleh: ObjectId, status: String, catatan: String }],
  timestamps: true
}

// models/SintesaQuota.js
{ tahun: { type: Number, unique: true }, total: { type: Number, default: 100 }, terpakai: { type: Number, default: 0 } }
```

### 7.5 Endpoint

```
GET   /sintesa/kuota                        umkm, staf, kabid
GET   /sintesa/syarat                       umkm   -> daftar produk yang memenuhi syarat + alasan yang belum
POST  /sintesa                              umkm (requireActiveUmkm)   (multipart foto)
GET   /sintesa/mine                         umkm
GET   /sintesa/:id                          umkm(pemilik), staf, kabid
POST  /sintesa/:id/batalkan                 umkm(pemilik)
GET   /sintesa                              staf, kabid   ?status=&page=
POST  /sintesa/:id/jadwal                   staf, kabid   body: { jadwalFinal }
POST  /sintesa/:id/desainer                 staf, kabid   body: { desainerNama }
POST  /sintesa/:id/selesai                  staf, kabid   body: { catatanHasil? }
POST  /sintesa/:id/tolak                    staf, kabid   body: { alasan }
```

---

## 8. PBI-15 — Dasbor Analitik Dinas dan Dasbor UMKM (FR-12)

**PIC:** Naila | **SP:** 5 | **Aktor:** `staf`, `kabid`, `umkm`

### 8.1 User Story

> **Sebagai** pimpinan atau staf dinas, **saya ingin** melihat ringkasan sebaran UMKM, kelengkapan izin, dan aktivitas layanan,  
> **agar** pembinaan dan keputusan didasarkan pada data.

> **Sebagai** pelaku UMKM, **saya ingin** melihat status produk, pesanan yang cocok, dan jadwal layanan saya dalam satu halaman,  
> **agar** saya tahu apa yang perlu saya lakukan berikutnya.

### 8.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-15-01 | Dasbor dinas menampilkan 4 kartu KPI: UMKM Produk Terdaftar, Produk Lolos Kurasi, Pesanan Besar (RFQ) Terpenuhi, Antrean Sintesa | Angka sesuai definisi 8.3 |
| AC-15-02 | Grafik batang ganda "Sebaran UMKM per Kecamatan": UMKM aktif dan UMKM dengan legalitas lengkap | Memuat semua 28 kecamatan; tampilan utama 6 teratas dan tautan "Lihat semua" |
| AC-15-03 | Kartu "Antrean Hari Ini": jumlah akun menunggu persetujuan, kurasi menunggu verifikasi, kurasi menunggu approval (khusus `kabid`), RFQ menunggu verifikasi, RFQ kuota penuh | Tiap angka berupa tautan ke antreannya |
| AC-15-04 | Kartu "Agenda Pembinaan": 3 event terdekat dengan kuota terisi | Dari modul event |
| AC-15-05 | Kartu "Forum Terbaru": 3 thread terbaru dan thread tersemat | Dari modul forum |
| AC-15-06 | Tombol "Unduh Rekapitulasi (.xlsx)" menghasilkan berkas dengan lembar: Ringkasan KPI, Sebaran per Kecamatan, Produk Terkurasi | Isi sama dengan layar |
| AC-15-07 | Filter periode (30 hari, 90 hari, tahun ini) memengaruhi KPI berbasis waktu (RFQ terpenuhi, Sintesa) | Angka berubah sesuai filter |
| AC-15-08 | Dasbor UMKM menampilkan kartu: Produk Saya (jumlah per status), status kurasi terbaru, jumlah RFQ terbuka yang cocok, jadwal Sintesa terdekat, event yang diikuti | Data hanya milik UMKM itu |
| AC-15-09 | Dasbor UMKM menampilkan tabel "Status Pengajuan Terbaru" (kurasi, Sintesa, event) | 5 terbaru |
| AC-15-10 | UMKM `menunggu_persetujuan` dan `ditolak` melihat banner status dan daftar langkah berikutnya, bukan angka kosong | Banner sesuai status |
| AC-15-11 | `mitra` diarahkan ke halaman RFQ miliknya (mitra tidak punya dasbor analitik) | Redirect sesuai |
| AC-15-12 | Dasbor selesai dimuat dalam 3 detik; hasil agregasi di-cache 60 detik di memori | Beban database ringan |
| AC-15-13 | Dasbor responsif: grid 4 kolom turun menjadi 2 dan 1 kolom di layar kecil | Diuji di 360 px |

### 8.3 Definisi Metrik (sumber kebenaran tunggal)

| Metrik | Definisi |
|--------|----------|
| UMKM Produk Terdaftar | Jumlah `User` role `umkm` berstatus `aktif` |
| Produk Lolos Kurasi | Jumlah `Product` berstatus `terkurasi` |
| RFQ Terpenuhi | Jumlah `RFQ` berstatus `terpenuhi` (dalam periode filter, berdasarkan `terpenuhiAt`) |
| Antrean Sintesa | Jumlah `SintesaRequest` berstatus `diajukan`, `dijadwalkan`, atau `desain_dikerjakan` |
| UMKM aktif per kecamatan | `BusinessProfile` dikelompokkan per `kecamatan` untuk user `aktif` |
| Legalitas lengkap | UMKM yang semua dokumen wajib kategorinya berstatus `valid` (pakai `documentService.getRequiredDocs`) |

```js
// contoh: sebaran per kecamatan
BusinessProfile.aggregate([
  { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
  { $unwind: '$u' }, { $match: { 'u.status': 'aktif' } },
  { $lookup: { from: 'legaldocuments', localField: '_id', foreignField: 'businessId', as: 'docs' } },
  { $group: { _id: '$kecamatan', aktif: { $sum: 1 }, /* legalitasLengkap dihitung di service */ } },
]);
```

### 8.4 Endpoint

```
GET /dashboard/dinas        staf, kabid   ?periode=30d|90d|tahun
GET /dashboard/dinas/export staf, kabid   -> .xlsx
GET /dashboard/umkm         umkm
```

Tidak ada skema database baru. Cache memakai objek `Map` dengan kunci `dinas:{periode}` dan `umkm:{businessId}`.

---

## 9. PBI-16 — Manajemen Akun, Matriks Hak Akses, Log Audit (FR-13)

**PIC:** Abdullah | **SP:** 2 | **Aktor:** `kabid`

### 9.1 User Story

> **Sebagai** kepala bidang, **saya ingin** menambah akun staf dan mitra, mengatur status aktifnya, dan melihat siapa melakukan apa,  
> **agar** hak akses terkendali dan semua tindakan penting dapat ditelusuri.

### 9.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-16-01 | Tabel pengguna: nama, email, role, status, terakhir masuk, dengan filter role dan status serta pencarian | Paginasi 10 per halaman |
| AC-16-02 | `kabid` menambah pengguna dengan role `staf` atau `mitra` (nama, email, nomor HP; untuk `mitra` juga nama instansi) | Akun UMKM tidak dibuat di sini (lewat PBI-06) |
| AC-16-03 | Akun baru memakai kata sandi sementara 10 karakter yang ditampilkan sekali dan `mustChangePassword = true` | Dipaksa ganti saat login pertama |
| AC-16-04 | Akun `mitra` otomatis mendapat ID Kemitraan `MTR-{tahun}-{seq4}` | Tampil di tabel |
| AC-16-05 | `kabid` dapat mengubah role antara `staf` dan `mitra` **hanya jika** akun belum punya data terkait (belum ada RFQ untuk mitra, belum ada tindakan verifikasi untuk staf); jika sudah, tampilkan pesan dan sarankan menonaktifkan | Validasi aturan |
| AC-16-06 | `kabid` mengaktifkan atau menonaktifkan akun apa pun (termasuk UMKM) dengan alasan wajib saat menonaktifkan; akun nonaktif langsung terputus sesinya | Request berikutnya 401 |
| AC-16-07 | `kabid` tidak dapat menonaktifkan atau menurunkan akunnya sendiri, dan sistem selalu menyisakan minimal 1 `kabid` aktif | Aksi ditolak dengan pesan |
| AC-16-08 | Reset kata sandi oleh `kabid`: membuat kata sandi sementara baru yang ditampilkan sekali | `mustChangePassword = true` |
| AC-16-09 | Halaman "Matriks Hak Akses" menampilkan tabel role dan area (sesuai PRD Sprint 1 seksi 2.2, ditambah Sprint 2 dan 3), hanya baca | Berasal dari satu berkas konfigurasi `config/permissions.js` |
| AC-16-10 | Halaman "Log Audit" menampilkan tindakan (waktu, pelaku, aksi, objek) dengan filter tanggal, pelaku, dan aksi; hanya baca | Tidak ada tombol ubah atau hapus |
| AC-16-11 | `staf` mengakses halaman akun atau log audit mendapat 403 | Diuji lewat tes role |
| AC-16-12 | Setiap perubahan akun tercatat di log audit | Entri tersimpan |

### 9.3 Logika

- `accountService.createUser` memakai validasi dan hash yang sama dengan modul auth Sprint 1 (tidak menduplikasi logika).
- Aturan role terakhir: sebelum menonaktifkan atau mengubah role `kabid`, hitung `User.countDocuments({ role: 'kabid', status: 'aktif' })`; jika hasilnya 1 dan target adalah akun itu, tolak.
- Keterkaitan data (AC-16-05): mitra dianggap punya data jika `RFQ.exists({ mitraUserId })`; staf dianggap punya data jika ada entri `AuditLog` dengan `actorId` itu pada aksi verifikasi.
- Berkas `config/permissions.js` memuat matriks sebagai objek dan dipakai untuk tampilan **dan** sebagai referensi tes otomatis (setiap sel diuji terhadap middleware).

### 9.4 Endpoint

```
GET    /accounts                       kabid   ?role=&status=&q=&page=
POST   /accounts                       kabid   body: { nama, email, noHp, role, instansi? }
PATCH  /accounts/:id/role              kabid   body: { role }
PATCH  /accounts/:id/status            kabid   body: { status: 'aktif'|'nonaktif', alasan? }
POST   /accounts/:id/reset-password    kabid
GET    /permissions/matrix             kabid
GET    /audit-logs                     kabid   ?dari=&sampai=&actorId=&aksi=&page=
```

Tidak ada skema baru selain penambahan field `instansi` pada `User` (untuk mitra) yang dilakukan lewat pull request ke Naila (pemilik `User.js`).

---

## 10. Kebutuhan Non-Fungsional Sprint 3

| Aspek | Target |
|-------|--------|
| Konsistensi data | Kursi event dan kuota Sintesa tidak pernah melebihi batas walau diakses bersamaan |
| Keamanan | Input forum dibersihkan, moderasi tercatat, hak akses ditegakkan di backend |
| Waktu respons | Dasbor dan daftar 3 detik atau kurang; cache dasbor 60 detik |
| Responsif | Semua halaman baru nyaman di 360 px |
| Audit | Seluruh aksi akun, moderasi, dan perubahan status layanan tercatat |
| UI | Tailwind, tanpa emoji, gaya sama dengan Sprint 1 dan 2 |

---

## 11. Out of Scope Sprint 3

- Notifikasi email atau push untuk event, balasan forum, atau jadwal Sintesa
- Unggah lampiran pada forum
- Pembayaran biaya pameran atau pelatihan
- Dasbor untuk `mitra`
- Integrasi data PL-KUMKM pusat
- Reaksi, mention, dan thread bersarang pada forum

---

## 12. Rencana Setelah Sprint 3

| Tahap | Cakupan |
|-------|---------|
| Integrasi | Gabung semua modul di `develop`, perbaikan bug lintas modul |
| Black-Box Testing | Logika sistem, validasi input, hak akses (seluruh sel matriks hak akses) |
| Deploy staging | Konfigurasi hosting, basis data, variabel lingkungan, pemeriksaan pasca-deploy |
| UAT | Skenario utama bersama perwakilan dinas dan UMKM, kuesioner SUS (target minimal 70) |
| Design refinement | Perbaikan berdasarkan hasil UAT |

---

## 13. Definition of Done (DoD)

- [ ] Semua Acceptance Criteria terpenuhi
- [ ] Kode di-merge ke `develop` lewat pull request yang direview
- [ ] `npm run seed` membuat seed Sprint 1, 2, dan 3 dari database kosong
- [ ] Tes konkurensi untuk kursi event dan kuota Sintesa lulus
- [ ] State machine Sintesa: aksi di luar alur mengembalikan 409
- [ ] Setiap sel matriks hak akses diuji (role berhak lolos, role lain 403)
- [ ] Metrik dasbor cocok dengan definisi 8.3 pada seed data
- [ ] Tidak ada data sensitif yang bocor di respons API
- [ ] UI konsisten dan tanpa emoji

---

## 14. Keputusan Terbuka

| ID | Pertanyaan | Nilai bawaan | Perlu dikonfirmasi ke |
|----|-----------|--------------|----------------------|
| K-15 | Pendaftaran event perlu diverifikasi staf atau langsung disetujui? | Perlu diverifikasi staf (status `menunggu_verifikasi`) | Ibu Juli |
| K-16 | Kapan kuota subsidi cetak Sintesa dipotong? | Saat status menjadi `desain_dikerjakan` | Ibu Juli |
| K-17 | Siapa yang berperan sebagai konsultan/desainer Sintesa? | Nama desainer diisi staf sebagai teks, bukan akun tersendiri | Ibu Juli |
| K-18 | Boleh `mitra` melihat forum? | Tidak | Tim |
| K-19 | Boleh `staf` mengelola akun? | Tidak. Hanya `kabid` | Ibu Juli |
| K-20 | Apakah sebutan "Kadis" pada desain sama dengan role `kabid`? | Ya, satu role `kabid` untuk pimpinan | Tim |

---

## 15. Referensi

- PRD SIPK-Lebak Sprint 1 (kontrak bersama Seksi 4) dan Sprint 2
- Proposal Capstone, Tabel Product Backlog (FR-09 sampai FR-13)
- Desain UI SIPK-Lebak (screen Event, Forum, Sintesa, Dasbor, Manajemen Akun)
- Transkrip wawancara Kepala Bidang UMKM Dinkop UKM Kabupaten Lebak
