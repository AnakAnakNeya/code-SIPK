# Product Requirements Document (PRD)
## SIPK-Lebak — Sprint 1: Fondasi, Data UMKM, Produk, dan Kurasi

**Versi:** 1.0  
**Kelompok:** Capstone Design Project, S1 Sistem Informasi, Telkom University  
**Tim:** Naila Hafidz Bachtiar, Muhammad Fariz Eka Putra, Abdullah Muchtar Rasyid  
**Studi kasus:** Dinas Koperasi dan UKM Kabupaten Lebak  
**Jadwal:** mengikuti jadwal acuan tim (lihat Seksi 15, keputusan K-09)

> Dokumen ini adalah PRD 1 dari 3. PRD Sprint 2 (RFQ dan agregasi kuota) dan PRD Sprint 3 (event, forum, Sintesa, dasbor, manajemen akun) memakai **kontrak bersama di Seksi 4 dokumen ini**. Baca Seksi 4 sebelum menulis kode apa pun.

---

## 1. Ringkasan Produk

**SIPK-Lebak** adalah portal web responsif (mobile-first) untuk pembinaan dan kurasi UMKM produk (kriya tenun Baduy dan olahan pangan) di Kabupaten Lebak. Portal ini menghubungkan Pelaku UMKM, Dinas Koperasi dan UKM, dan Mitra Pembeli. Portal ini **bukan marketplace**: tidak ada keranjang, pembayaran, atau pengiriman.

**Tujuan Sprint 1:** pada akhir sprint, UMKM bisa mendaftar, dokumennya diperiksa dinas, produknya dikurasi dan muncul di katalog publik dengan lencana **Terkurasi Dinas**. Ini fondasi untuk RFQ (Sprint 2) dan layanan lain (Sprint 3).

**Tech Stack (mengikuti proposal, lihat keputusan K-01):**
- Frontend: React 18 + Vite, React Router v6, Tailwind CSS, Axios
- Backend: Node.js 20 + Express 4
- Database: MongoDB + Mongoose 8
- Auth: JWT (cookie httpOnly) + bcrypt
- Upload: Multer + Sharp (kompresi foto) + file-type (cek tipe file)
- Validasi: Zod (backend), dipakai juga untuk pesan error ke frontend
- Excel: ExcelJS

---

## 2. Aktor dan Keputusan Wewenang

Sistem hanya memakai **4 aktor**. Peran "Konsultan PLUT" dan "Super Admin" pada draf PRD sebelumnya digabung supaya implementasi lebih sederhana.

| Kode role | Aktor | Siapa | Catatan |
|-----------|-------|-------|---------|
| `umkm` | Pelaku UMKM | Perajin tenun, produsen pangan olahan | Registrasi mandiri |
| `staf` | Staf Dinas (staf biasa) | Staf Bidang UMKM Dinkop UKM | Pemeriksa berkas, pengelola antrean. **Tidak** punya wewenang keputusan akhir |
| `kabid` | Pimpinan Dinas (Kabid UMKM) | Ibu Juli Zakiah dan pimpinan setara | Semua wewenang `staf` **ditambah** approval akhir kurasi dan manajemen akun |
| `mitra` | Mitra Pembeli | Hotel, ritel, instansi pengadaan | Akun dibuat dinas, tidak ada registrasi mandiri |

**Pengunjung tanpa login** (publik) bukan aktor. Mereka hanya boleh melihat katalog produk terkurasi dan jadwal event.

**Aturan pewarisan:** `kabid` boleh melakukan semua yang boleh dilakukan `staf`. Di kode: `authorize('staf')` otomatis meloloskan `kabid`.

### 2.1 Siapa boleh melakukan apa (khusus verifikasi dan keputusan)

Ini jawaban atas pertanyaan "apakah verifikasi bisa dilakukan staf biasa atau tidak".

| Tindakan | `staf` | `kabid` | Alasan |
|----------|:------:|:-------:|--------|
| Menyetujui akun UMKM baru (cek NIB dan profil) | Ya | Ya | Pemeriksaan identitas rutin |
| Memeriksa dan menandai status dokumen izin (valid / perlu revisi / tidak valid) | Ya | Ya | Pekerjaan teknis harian |
| Mengisi hasil pemeriksaan kurasi tahap 1 sampai 3 | Ya | Ya | Pekerjaan teknis |
| Memberi **rekomendasi** setuju atau revisi kurasi | Ya | Ya | Staf menyaring berkas |
| Mengembalikan kurasi ke UMKM untuk revisi | Ya | Ya | Tidak butuh pimpinan |
| **Menyetujui kurasi akhir dan menerbitkan lencana + SK + grade** | **Tidak** | **Ya** | Lencana adalah klaim resmi dinas |
| Mendaftarkan UMKM binaan secara manual | Ya | Ya | Membantu UMKM literasi rendah |
| Mengelola akun staf dan mitra | Tidak | Ya | Hak akses sistem |

Alur kurasi: UMKM mengajukan, `staf` memeriksa lalu merekomendasikan, `kabid` memutuskan. Jika staf merekomendasikan revisi, produk langsung kembali ke UMKM tanpa melewati `kabid`.

### 2.2 Matriks akses route (ditegakkan di backend)

| Area | `umkm` | `staf` | `kabid` | `mitra` | Publik |
|------|:------:|:------:|:-------:|:-------:|:------:|
| Katalog produk terkurasi | Lihat | Lihat | Lihat | Lihat | Lihat |
| Profil, dokumen, produk milik sendiri | Kelola | - | - | - | - |
| Direktori UMKM, dokumen milik UMKM lain | - | Lihat | Lihat | - | - |
| Persetujuan akun UMKM, daftarkan UMKM manual | - | Ya | Ya | - | - |
| Pemeriksaan kurasi (tahap 1 sampai 3, rekomendasi) | - | Ya | Ya | - | - |
| Keputusan akhir kurasi | - | - | Ya | - | - |

Route yang tidak diizinkan mengembalikan **403** (sudah login tapi bukan haknya) atau **401** (belum login). Menyembunyikan menu di frontend saja **tidak cukup**.

### 2.3 Status akun UMKM dan dampaknya

| Status akun | Arti | Boleh login | Boleh edit profil dan unggah dokumen | Boleh ajukan kurasi, ambil kuota, daftar event/Sintesa |
|-------------|------|:-----------:|:-----------------------------------:|:-----------------------------------------------------:|
| `menunggu_persetujuan` | Baru daftar, belum dicek dinas | Ya | Ya | **Tidak** |
| `aktif` | Disetujui dinas | Ya | Ya | Ya |
| `ditolak` | Ditolak dinas, ada catatan | Ya (lihat alasan, perbaiki, ajukan ulang) | Ya | Tidak |
| `nonaktif` | Dinonaktifkan kabid | **Tidak** | - | - |

---

## 3. Scope Sprint 1

Sprint 1 mencakup **FR-01 sampai FR-05 dan FR-14** (21 SP dari proposal + FR-14 usulan 3 SP).

| PBI | Nama Fitur | FR | PIC (usulan) | SP |
|-----|-----------|----|--------------|----|
| PBI-01 | Autentikasi, registrasi UMKM, RBAC, profil usaha | FR-01 | Naila | 5 |
| PBI-02 | Dokumen legalitas | FR-02 | Abdullah | 3 |
| PBI-03 | Kelola produk | FR-03 | Fariz | 5 |
| PBI-04 | Pengajuan dan verifikasi kurasi | FR-04 | Abdullah | 5 |
| PBI-05 | Katalog produk terkurasi (publik) | FR-05 | Fariz | 3 |
| PBI-06 | Direktori UMKM, persetujuan akun, daftar UMKM manual | FR-14 | Naila | 3 |

Beban per anggota: Naila 8 SP, Fariz 8 SP, Abdullah 8 SP. PIC adalah usulan dan boleh ditukar selama batas kepemilikan file di Seksi 4.7 tetap dijaga.

---

## 4. Kontrak Bersama Tim (WAJIB DIBACA)

Bagian ini memastikan tiga orang yang mengoding bersamaan menghasilkan kode yang cocok saat digabung.

### 4.1 Struktur proyek

```
sipk-lebak/
├── backend/
│   ├── src/
│   │   ├── config/            env.js, db.js
│   │   ├── constants/         roles.js, kecamatan.js, enums.js
│   │   ├── middleware/        authenticate.js, authorize.js, requireActiveUmkm.js,
│   │   │                      upload.js, errorHandler.js, validate.js
│   │   ├── models/            satu file per model (User.js, Product.js, ...)
│   │   ├── modules/
│   │   │   ├── auth/          routes, controller, service   (Naila)
│   │   │   ├── umkm/          routes, controller, service   (Naila)
│   │   │   ├── documents/     routes, controller, service   (Abdullah)
│   │   │   ├── kurasi/        routes, controller, service   (Abdullah)
│   │   │   ├── products/      routes, controller, service   (Fariz)
│   │   │   └── catalog/       routes, controller, service   (Fariz)
│   │   ├── utils/             codeGenerator.js, auditLog.js, response.js, slug.js, files.js
│   │   ├── seeders/           index.js + seeder per modul
│   │   └── app.js, server.js
│   └── uploads/
│       ├── public/            foto produk (boleh diakses publik)
│       └── private/           dokumen izin (hanya lewat endpoint ber-otorisasi)
└── frontend/
    └── src/
        ├── api/               axios instance + satu file per modul
        ├── components/        ui/ (Button, Badge, Card, Modal, Table, Input, ...), layout/
        ├── config/            menuConfig.js, routes.jsx
        ├── context/           AuthContext.jsx
        ├── pages/             auth/, umkm/, dinas/, mitra/, publik/
        └── utils/
```

### 4.2 Konvensi API

- Semua endpoint berawalan `/api/v1`.
- Format sukses: `{ "success": true, "data": ..., "message": "..." }`
- Format gagal: `{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "fields": { "nib": "NIB harus 13 digit angka" } } }`
- Kode error baku: `VALIDATION_ERROR` (422), `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL` (500). Pesan selalu berbahasa Indonesia dan spesifik.
- Paginasi: query `?page=1&limit=10`; respons `data: { items: [], pagination: { page, limit, total, totalPages } }`. Batas `limit` maksimum 50.
- Tanggal disimpan UTC, ditampilkan WIB (Asia/Jakarta). Uang dalam Rupiah sebagai bilangan bulat (tanpa desimal).
- Setiap respons ke klien melewati fungsi DTO. **Jangan pernah** mengembalikan `passwordHash`, path file privat, atau dokumen mentah model.

### 4.3 Konstanta dan enum bersama

File `backend/src/constants/enums.js` (dibuat Naila di hari pertama, tidak diubah tanpa kabar ke tim):

```js
export const ROLES = { UMKM: 'umkm', STAF: 'staf', KABID: 'kabid', MITRA: 'mitra' };

export const STATUS_AKUN = ['menunggu_persetujuan', 'aktif', 'ditolak', 'nonaktif'];

export const KATEGORI = { KRIYA: 'kriya_tenun', PANGAN: 'olahan_pangan' };

export const JENIS_DOKUMEN = ['nib', 'spp_irt', 'halal', 'uji_umur_simpan', 'hak_merek'];
export const STATUS_DOKUMEN = ['belum_diperiksa', 'valid', 'perlu_revisi', 'tidak_valid'];

export const STATUS_PRODUK = ['draf', 'menunggu_verifikasi', 'perlu_revisi', 'terkurasi'];
export const GRADE = ['A', 'B'];

export const STATUS_KURASI = [
  'menunggu_verifikasi',  // baru diajukan UMKM, belum diambil staf
  'dalam_pemeriksaan',    // sedang diperiksa staf
  'menunggu_approval',    // staf merekomendasikan setuju, menunggu kabid
  'perlu_revisi',         // dikembalikan ke UMKM
  'disetujui',            // kabid menyetujui
];
```

`constants/kecamatan.js` berisi 28 kecamatan Kabupaten Lebak (nilai persis, dipakai sebagai enum di semua modul):

```js
export const KECAMATAN = [
  'Malingping','Wanasalam','Panggarangan','Cihara','Bayah','Cilograng','Cibeber',
  'Cijaku','Banjarsari','Cileles','Gunung Kencana','Bojongmanik','Cirinten',
  'Leuwidamar','Muncang','Sobang','Cipanas','Sajira','Cimarga','Cikulur',
  'Warunggunung','Cibadak','Rangkasbitung','Kalanganyar','Lebakgedong',
  'Curugbitung','Maja','Cigemblong'
]; // 28 item
```

### 4.4 Middleware (kontrak tanda tangan fungsi)

```js
// middleware/authenticate.js  -> mengisi req.user = { id, role, status }, atau 401
// middleware/authorize.js
authorize('staf')            // staf dan kabid lolos (kabid mewarisi staf)
authorize('kabid')           // hanya kabid
authorize('umkm', 'mitra')   // salah satu dari role tersebut
// middleware/requireActiveUmkm.js -> role umkm DAN status 'aktif', selain itu 403 dengan
//   code 'AKUN_BELUM_AKTIF' dan pesan yang menjelaskan status akun
```

**Cara mengoding paralel tanpa menunggu login jadi:** pada hari pertama Naila mendorong `authenticate`/`authorize` versi awal, seeder user, dan `AuthContext` kosong ke `develop`. Selama login belum selesai, saat `NODE_ENV=development` backend menerima header `x-dev-user: <email user seed>` untuk menyamar sebagai user seed. Header ini **dihapus/dinonaktifkan** saat `NODE_ENV=production`.

### 4.5 Penomoran dokumen

Fungsi `generateCode(prefix, { year, month })` di `utils/codeGenerator.js` memakai koleksi `counters` dengan `findOneAndUpdate({ _id: key }, { $inc: { seq: 1 } }, { upsert: true, new: true })` agar atomik.

| Objek | Format | Contoh |
|-------|--------|--------|
| Pengajuan kurasi | `KUR-{tahun}-{seq3}` | `KUR-2026-084` |
| Nomor SK kurasi | `SK-KUR/{seq3}/{romawiBulan}/{tahun}` | `SK-KUR/012/XI/2026` |
| ID kemitraan mitra | `MTR-{tahun}-{seq4}` | `MTR-2026-0089` |
| RFQ (Sprint 2) | `RFQ-{tahun}-{seq3}` | `RFQ-2026-012` |
| PO Summary (Sprint 2) | `PO-RFQ/{tahun}/{romawiBulan}/{seq3}` | `PO-RFQ/2026/XI/012` |
| Sintesa (Sprint 3) | `SIN-{tahun}-{seq3}` | `SIN-2026-007` |

Urutan reset tiap tahun (key counter mengandung tahun).

### 4.6 Audit log (dipakai semua modul)

```js
// utils/auditLog.js
await auditLog.write({ actorId, action: 'kurasi.disetujui', entity: 'KurasiSubmission',
                       entityId, meta: { grade: 'A' }, ip: req.ip });
```

Model `AuditLog` (append-only, tidak ada update/delete): `{ actorId, action, entity, entityId, meta, ip, createdAt }`. Wajib dipanggil untuk: login gagal beruntun, persetujuan/penolakan akun, verifikasi dokumen, setiap perubahan status kurasi, akses file dokumen oleh staf/kabid.

### 4.7 Kepemilikan file (mencegah konflik merge)

| Area | Pemilik | Boleh diubah anggota lain? |
|------|---------|---------------------------|
| `constants/*`, `middleware/*`, `utils/*`, `models/User.js`, `models/BusinessProfile.js`, `models/AuditLog.js`, `components/ui/*`, `components/layout/*`, `config/menuConfig.js` | Naila | Hanya lewat pull request dengan review pemilik |
| `modules/documents/*`, `modules/kurasi/*`, `models/LegalDocument.js`, `models/KurasiSubmission.js` | Abdullah | Tidak |
| `modules/products/*`, `modules/catalog/*`, `models/Product.js` | Fariz | Tidak |
| `modules/auth/*`, `modules/umkm/*` | Naila | Tidak |

`menuConfig.js` sudah memuat **semua menu semua sprint** sejak awal (menu yang belum dikerjakan `enabled: false`), sehingga tidak ada yang perlu mengedit file itu lagi.

**Git:** branch `feature/pbi-xx-nama-singkat`, merge ke `develop` lewat pull request. Commit kecil dan sering. Jangan push langsung ke `main`.

### 4.8 Kontrak antar-PBI (fungsi dan endpoint yang dipakai orang lain)

| Disediakan oleh | Nama | Dipakai oleh | Keterangan |
|-----------------|------|--------------|------------|
| Naila (PBI-01) | `authenticate`, `authorize`, `requireActiveUmkm` | Semua | Lihat 4.4 |
| Naila (PBI-01) | `req.businessId` (diisi `requireActiveUmkm` dan `loadBusiness`) | Fariz, Abdullah | Id `BusinessProfile` milik user yang login |
| Abdullah (PBI-02) | `documentService.getRequiredDocs(kategori)` | Abdullah (PBI-04), Naila (PBI-06) | Daftar jenis dokumen wajib per kategori |
| Abdullah (PBI-02) | `documentService.summaryForBusiness(businessId)` | Naila (PBI-06) | `{ lengkap: bool, perJenis: {...} }` |
| Abdullah (PBI-02) | `POST /documents` | Naila (wizard registrasi) | Upload NIB setelah akun dibuat |
| Abdullah (PBI-04) | `kurasiService.createSubmission(productId, userId)` | Fariz (PBI-03) | Dipanggil saat tombol "Ajukan Kurasi" |
| Fariz (PBI-03) | `Product` model | Abdullah, Naila | Skema di PBI-03 |

Jika fungsi yang dibutuhkan belum merge, gunakan stub dengan nama dan tanda tangan yang sama (return data dummy) lalu ganti saat merge.

---

## 5. Dependensi dan Dummy Data Sprint 1

Karena tiga orang mengerjakan bersamaan, setiap fitur harus bisa dites sendiri memakai seed.

### 5.1 Seed user (`seeders/userSeeder.js`, dibuat Naila hari pertama)

Semua kata sandi seed: `Password123!` (hanya untuk development).

| Email | Role | Nama | Status | Catatan |
|-------|------|------|--------|---------|
| `juli@diskop-lebak.go.id` | `kabid` | Ibu Juli Zakiah | aktif | Kabid UMKM |
| `staf1@diskop-lebak.go.id` | `staf` | Rina Marlina | aktif | Staf verifikator |
| `staf2@diskop-lebak.go.id` | `staf` | Dedi Supriadi | aktif | Staf |
| `ambu.kanekes@example.com` | `umkm` | Sarmi (Tenun Ambu Kanekes) | aktif | Kriya, Leuwidamar |
| `aren.jaya@example.com` | `umkm` | Hj. Entin (KUB Aren Jaya) | aktif | Pangan, Sobang |
| `berkah.pangan@example.com` | `umkm` | Ujang (UMKM Berkah Pangan) | menunggu_persetujuan | Pangan, Rangkasbitung |
| `procurement@hotelbanten.example` | `mitra` | Hotel & Konferensi Banten | aktif | `MTR-2026-0001` |

### 5.2 Seed profil usaha, dokumen, produk (dummy)

```js
// seeders/businessSeeder.js (contoh 2 dari 3 profil)
[
  { namaUsaha: 'UMKM Tenun Ambu Kanekes', kecamatan: 'Leuwidamar', nib: '9120300451829',
    kategoriUtama: 'kriya_tenun', subKomoditas: ['Tenun Suat Songket'],
    alamat: 'Kampung Kadu Ketug RT 02/RW 01', tahunMulai: 2018, waUsaha: '081298441920' },
  { namaUsaha: 'KUB Aren Jaya Sobang', kecamatan: 'Sobang', nib: '9120300451830',
    kategoriUtama: 'olahan_pangan', subKomoditas: ['Gula Aren Semut'],
    alamat: 'Desa Sobang RT 01/RW 03', tahunMulai: 2015, waUsaha: '081377112233' },
]
```

Seed `LegalDocument` untuk UMKM aktif: NIB `valid` untuk keduanya; KUB Aren Jaya memiliki `spp_irt` valid, `halal` belum diperiksa, `uji_umur_simpan` (12 bulan) belum diperiksa. Seed file dokumen memakai PDF dummy kecil di `uploads/private/seed/`.

Seed `Product` (6 produk):

| Produk | UMKM | Kategori | Harga acuan | Kapasitas/bulan | Status kurasi |
|--------|------|----------|-------------|-----------------|---------------|
| Tenun Ikat Baduy Motif Suat Songket | Ambu Kanekes | kriya | Rp350.000/lembar | 45 | `terkurasi` (grade B) |
| Selendang Tenun Baduy Motif Poleng | Ambu Kanekes | kriya | Rp180.000/lembar | 30 | `draf` |
| Gula Aren Semut Organik 500g | Aren Jaya | pangan | Rp28.000/pak | 600 | `menunggu_verifikasi` (ada 1 KurasiSubmission) |
| Gula Aren Cetak 250g | Aren Jaya | pangan | Rp15.000/pak | 400 | `perlu_revisi` (ada catatan revisi) |
| Keripik Pisang Kepok Manis | Berkah Pangan | pangan | Rp15.000/pak | 300 | `draf` |
| Emping Melinjo 250g | Aren Jaya | pangan | Rp22.000/pak | 200 | `terkurasi` (grade A) |

### 5.3 Pemetaan dependensi

| Fitur | Butuh | Selama belum jadi |
|-------|-------|-------------------|
| PBI-03 Produk | `requireActiveUmkm`, `kurasiService.createSubmission` | Header `x-dev-user`, stub `createSubmission` |
| PBI-04 Kurasi | Model `Product`, dokumen | Seed produk dan dokumen (5.2) |
| PBI-05 Katalog | Produk berstatus `terkurasi` | Seed produk (5.2) |
| PBI-06 Direktori | `documentService.summaryForBusiness` | Stub return `{ lengkap: false, perJenis: {} }` |

---

## 6. PBI-01 — Autentikasi, Registrasi UMKM, RBAC, Profil Usaha (FR-01)

**PIC:** Naila | **SP:** 5 | **Aktor:** Semua

### 6.1 User Story

> **Sebagai** pelaku UMKM di Lebak,  
> **saya ingin** mendaftar sendiri lewat ponsel dan masuk memakai email atau NIB,  
> **agar** usaha saya tercatat di dinas tanpa harus datang ke kantor.

> **Sebagai** staf atau pimpinan dinas,  
> **saya ingin** masuk dan hanya melihat menu sesuai wewenang saya,  
> **agar** tidak ada data atau tombol yang bukan hak saya.

### 6.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-01-01 | Registrasi berupa wizard 3 langkah dengan indikator progres dan tombol Kembali; data yang sudah diisi tidak hilang saat Kembali | Pindah langkah tidak mereset form |
| AC-01-02 | Langkah 1 (Data Pemilik): nama, email, nomor HP, kata sandi, ulangi kata sandi | Semua field tervalidasi |
| AC-01-03 | Langkah 2 (Data Usaha): nama usaha, kecamatan (28 pilihan), tahun mulai, alamat sentra, WA usaha, NIB, unggah salinan NIB | Helper text NIB: "13 digit angka sesuai izin OSS-RBA" |
| AC-01-04 | Langkah 3 (Komoditas dan Legalitas): kategori utama, sub-komoditas (chip), dokumen opsional (SPP-IRT, Halal, Uji Masa Simpan), pernyataan kebenaran data wajib dicentang | Tombol "Selesaikan dan Ajukan Akun" nonaktif jika belum dicentang |
| AC-01-05 | NIB harus 13 digit angka dan belum pernah terdaftar; email harus unik | Pesan error spesifik per field (422) |
| AC-01-06 | Setelah registrasi, akun berstatus `menunggu_persetujuan`, pengguna otomatis masuk, dan melihat banner "Akun menunggu persetujuan dinas" | Banner tampil di semua halaman UMKM sampai disetujui |
| AC-01-07 | Berkas NIB dan dokumen opsional diunggah setelah akun dibuat lewat `POST /documents` (PBI-02). Jika unggah gagal, akun tetap ada dan UMKM diminta melengkapi dari menu Profil dan Dokumen | Tidak ada akun "setengah jadi" yang tidak bisa diperbaiki |
| AC-01-08 | Login satu form: kolom "Email atau NIB" dan kata sandi, opsi "Ingat saya", tautan "Lupa sandi?" dan "Daftar sebagai Pelaku UMKM" | Input 13 digit angka dianggap NIB, selain itu dianggap email |
| AC-01-09 | Login gagal menampilkan pesan generik "Email/NIB atau kata sandi salah" (tidak membocorkan akun ada atau tidak) | Pesan sama untuk akun tidak ada dan sandi salah |
| AC-01-10 | Maksimal 5 percobaan gagal per kombinasi (identifier + IP) dalam 15 menit; setelahnya 429 dengan sisa waktu tunggu | Blokir otomatis terbuka setelah 15 menit |
| AC-01-11 | Akun `nonaktif` tidak bisa login dan melihat pesan "Akun dinonaktifkan, hubungi dinas" | Status 403 |
| AC-01-12 | Setelah login pengguna diarahkan sesuai role: `umkm` ke `/umkm/dasbor`, `staf`/`kabid` ke `/dinas/dasbor`, `mitra` ke `/mitra/katalog` | Menu samping berbeda per role |
| AC-01-13 | Akses route di luar wewenang role dibalas 403 dan halaman "Anda tidak memiliki akses" | Diuji untuk setiap pasangan role dan route di 2.2 |
| AC-01-14 | Lupa sandi: tautan reset dikirim ke email, berlaku 30 menit dan sekali pakai | Token lama tidak bisa dipakai ulang |
| AC-01-15 | Akun yang dibuat dinas (`mustChangePassword = true`) dipaksa ganti kata sandi pada login pertama | Tidak bisa membuka halaman lain sebelum ganti |
| AC-01-16 | UMKM dapat melihat dan mengubah profil usaha di menu "Profil Usaha" (kecuali NIB, hanya dinas yang bisa mengubah NIB) | Perubahan tersimpan, `updatedAt` berubah |
| AC-01-17 | Logout menghapus cookie; token tidak dapat dipakai setelahnya | Request berikutnya 401 |
| AC-01-18 | Halaman registrasi dan login ringan (tanpa gambar besar) agar cepat dimuat di sinyal lemah | Ukuran halaman awal di bawah 300 KB |

### 6.3 Logika

**Penentuan identifier login:**
```js
const isNib = /^\d{13}$/.test(identifier.trim());
const user = isNib
  ? await findUserByNib(identifier)          // lewat BusinessProfile.nib -> userId
  : await User.findOne({ email: identifier.trim().toLowerCase() });
```

**JWT dan cookie:**
- Payload: `{ sub: userId, role }`. Status akun **dibaca ulang dari database** pada setiap request di `authenticate` (supaya akun yang dinonaktifkan langsung terputus).
- Cookie `token`: `httpOnly`, `sameSite: 'lax'`, `secure` di production. Masa berlaku 8 jam; jika "Ingat saya" dicentang 7 hari.
- Kata sandi: bcrypt cost 10, minimal 8 karakter, wajib ada huruf dan angka.

**Rate limiting:** `express-rate-limit` pada `POST /auth/login` dengan key `${ip}:${identifier}`, window 15 menit, max 5 kegagalan (request sukses tidak dihitung).

**Reset sandi:** token acak 32 byte, yang disimpan di database hanya hash SHA-256-nya, `resetExpires = now + 30 menit`. Pengiriman email lewat Nodemailer (SMTP dari `.env`). Jika `SMTP_HOST` kosong di development, tautan reset dicetak ke console.

**Registrasi (`POST /auth/register`) langkah server:**
1. Validasi seluruh payload dengan Zod.
2. Cek unik email dan NIB (409 dengan `fields`).
3. Buat `User` (role `umkm`, status `menunggu_persetujuan`) dan `BusinessProfile` dalam satu alur; jika pembuatan profil gagal, hapus user (kompensasi).
4. Set cookie token dan kembalikan DTO user.

### 6.4 Skema Database

```js
// models/User.js
{
  nama: String (required),
  email: String (required, unique, lowercase),
  noHp: String (required),
  passwordHash: String (required, select: false),
  role: { type: String, enum: Object.values(ROLES), required: true },
  status: { type: String, enum: STATUS_AKUN, default: 'menunggu_persetujuan' },
  catatanStatus: String,                 // alasan ditolak/nonaktif
  mustChangePassword: { type: Boolean, default: false },
  mitraId: String,                       // 'MTR-2026-0089', khusus role mitra
  createdVia: { type: String, enum: ['mandiri', 'dinas', 'seed'], default: 'mandiri' },
  createdBy: ObjectId (ref User),
  resetTokenHash: String, resetExpires: Date,
  lastLoginAt: Date,
  timestamps: true
}

// models/BusinessProfile.js
{
  userId: ObjectId (ref User, required, unique),
  namaUsaha: String (required),
  kecamatan: { type: String, enum: KECAMATAN, required: true },
  alamat: String (required),
  tahunMulai: Number (min 1950, max tahun sekarang),
  waUsaha: String (required),
  nib: { type: String, required: true, unique: true },     // 13 digit
  kategoriUtama: { type: String, enum: Object.values(KATEGORI), required: true },
  subKomoditas: [String],
  pernyataanBenarAt: Date,
  catatanVerifikasi: String, verifiedBy: ObjectId, verifiedAt: Date,
  timestamps: true
}
```

Index: `User.email` unik, `BusinessProfile.nib` unik, `BusinessProfile.kecamatan` dan `kategoriUtama` (untuk filter direktori).

### 6.5 Endpoint (prefix `/api/v1`)

```
POST /auth/register           public      -> daftar UMKM, auto-login
POST /auth/login              public
POST /auth/logout             login
GET  /auth/me                 login       -> user + businessProfile ringkas
POST /auth/forgot-password    public
POST /auth/reset-password     public
POST /auth/change-password    login
GET  /profil/saya             umkm
PUT  /profil/saya             umkm        -> ubah profil (tanpa NIB)
```

### 6.6 Validasi (Zod)

```js
// langkah 1
nama: z.string().min(3).max(100)
email: z.string().email().toLowerCase()
noHp: z.string().regex(/^(\+62|62|0)8\d{8,11}$/, 'Nomor HP tidak valid')
password: z.string().min(8).regex(/[A-Za-z]/).regex(/\d/)
// langkah 2
namaUsaha: z.string().min(3).max(120)
kecamatan: z.enum(KECAMATAN)
tahunMulai: z.number().int().min(1950).max(new Date().getFullYear())
alamat: z.string().min(10).max(300)
waUsaha: sama dengan noHp
nib: z.string().regex(/^\d{13}$/, 'NIB harus 13 digit angka')
// langkah 3
kategoriUtama: z.enum(['kriya_tenun','olahan_pangan'])
subKomoditas: z.array(z.string().min(2).max(40)).min(1).max(5)
pernyataanBenar: z.literal(true)
```

### 6.7 Tampilan UI

```
LOGIN                                    REGISTRASI
+------------------+-----------------+   Langkah 1 --- Langkah 2 --- Langkah 3
| Panel navy:      | Email atau NIB  |   (selesai)     (aktif)      (belum)
| logo SL          | [______________]|
| SIPK-LEBAK       | Kata sandi      |   Nama Unit Usaha [__________________]
| 1 kalimat        | [______________]|   Kecamatan [v 28 pilihan] Tahun [____]
| deskripsi        | [ ] Ingat saya  |   Alamat    [__________________]
|                  | [   Masuk   ]   |   NIB [_____________]  helper: 13 digit
|                  | Lupa sandi?     |   Unggah NIB [Pilih berkas]  PDF/JPG, maks 2 MB
+------------------+-----------------+   [Kembali]                 [Lanjut ke Langkah 3]
```

Layout shell (sidebar navy, header, avatar) dibuat Naila sebagai `AppLayout` dan dipakai semua halaman. Referensi desain: screen Stitch SIPK-Lebak (tanpa emoji, warna navy `#0F2A4F`).

---

## 7. PBI-02 — Dokumen Legalitas (FR-02)

**PIC:** Abdullah | **SP:** 3 | **Aktor:** UMKM (kelola), Staf dan Kabid (periksa)

### 7.1 User Story

> **Sebagai** pelaku UMKM, **saya ingin** mengunggah dan memperbarui dokumen izin usaha saya,  
> **agar** dinas bisa memeriksanya dan produk saya bisa dikurasi.

> **Sebagai** staf dinas, **saya ingin** melihat dokumen izin UMKM dan menandai valid atau tidaknya,  
> **agar** hasil pemeriksaan tercatat dan UMKM tahu apa yang harus diperbaiki.

### 7.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-02-01 | UMKM dapat mengunggah dokumen jenis `nib`, `spp_irt`, `halal`, `uji_umur_simpan`, `hak_merek` | Satu dokumen aktif per jenis per UMKM |
| AC-02-02 | NIB wajib; dokumen lain opsional pada tahap registrasi tetapi dibutuhkan saat kurasi sesuai kategori | `getRequiredDocs` mengembalikan daftar yang benar |
| AC-02-03 | Format PDF atau JPG, maksimal 2 MB; tipe dicek dari isi file, bukan hanya ekstensi | File lain ditolak dengan pesan jelas |
| AC-02-04 | Setiap jenis punya data pendamping: nomor dokumen (semua), masa berlaku (halal, SPP-IRT), masa simpan dalam bulan (uji umur simpan) | Field tervalidasi per jenis |
| AC-02-05 | Mengunggah ulang dokumen jenis yang sama menggantikan file lama dan mereset status ke `belum_diperiksa` | Status verifikasi lama hilang, riwayat dicatat di audit log |
| AC-02-06 | Dokumen **tidak dapat diganti atau dihapus** saat kurasi terkait berstatus `menunggu_approval` | 409 `DOC_LOCKED` |
| AC-02-07 | File dokumen hanya bisa dibuka oleh pemilik, `staf`, dan `kabid`; selain itu 403 | Verifikasi lewat tes role |
| AC-02-08 | Akses file oleh `staf`/`kabid` tercatat di audit log | Entri `dokumen.dilihat` tersimpan |
| AC-02-09 | `staf`/`kabid` dapat menandai status dokumen: `valid`, `perlu_revisi`, `tidak_valid`; catatan wajib jika bukan `valid` | Validasi catatan berjalan |
| AC-02-10 | UMKM melihat status dan catatan verifikasi per dokumen di halaman Profil dan Dokumen | Badge status berwarna |
| AC-02-11 | Dokumen yang sudah lewat masa berlaku ditandai "Kedaluwarsa" (tanda tampilan, tidak mengubah status verifikasi) | Properti virtual `kedaluwarsa` |
| AC-02-12 | Tidak ada path file privat di respons API mana pun | Pengecekan DTO |

### 7.3 Logika

**Dokumen wajib per kategori (kontrak, dipakai PBI-04 dan PBI-06):**

| Kategori | Wajib | Opsional |
|----------|-------|----------|
| `kriya_tenun` | `nib` | `hak_merek` |
| `olahan_pangan` | `nib`, `spp_irt`, `halal`, `uji_umur_simpan` | `hak_merek` |

```js
// modules/documents/service.js
export function getRequiredDocs(kategori) {
  return kategori === 'kriya_tenun'
    ? ['nib']
    : ['nib', 'spp_irt', 'halal', 'uji_umur_simpan'];
}

export async function summaryForBusiness(businessId) {
  // return { lengkap: boolean, perJenis: { nib: 'valid', spp_irt: 'belum_ada', ... } }
  // lengkap = semua dokumen wajib kategori berstatus 'valid'
}
```

**Penyimpanan:** `uploads/private/docs/{businessId}/{uuid}.{ext}`. Nama asli file disimpan di database (`namaAsli`) dan dipakai saat unduh. Folder `private` **tidak** diserve oleh `express.static`. Setiap respons file memakai `Cache-Control: no-store`.

**Upsert:** `LegalDocument.findOneAndUpdate({ businessId, jenis }, {...}, { upsert: true })`, lalu hapus file lama dari disk setelah database berhasil diperbarui.

### 7.4 Skema Database

```js
// models/LegalDocument.js
{
  businessId: ObjectId (ref BusinessProfile, required),
  jenis: { type: String, enum: JENIS_DOKUMEN, required: true },
  nomor: String,
  masaBerlaku: Date,
  masaSimpanBulan: Number,                 // khusus uji_umur_simpan
  file: { path: String, namaAsli: String, mime: String, ukuran: Number },
  statusVerifikasi: { type: String, enum: STATUS_DOKUMEN, default: 'belum_diperiksa' },
  catatan: String,
  verifiedBy: ObjectId (ref User), verifiedAt: Date,
  uploadedBy: ObjectId,
  timestamps: true
}
// index unik: { businessId: 1, jenis: 1 }
```

### 7.5 Endpoint

```
POST   /documents                        umkm        (multipart: file, jenis, nomor, masaBerlaku, masaSimpanBulan)
GET    /documents/mine                   umkm
GET    /documents?businessId=            staf, kabid
GET    /documents/:id/file               pemilik, staf, kabid   -> stream file
PATCH  /documents/:id/verifikasi         staf, kabid  body: { status, catatan }
DELETE /documents/:id                    umkm   (bukan NIB, tidak terkunci)
```

### 7.6 Validasi

```js
nomor: nib -> /^\d{13}$/ ; spp_irt, halal, hak_merek -> string min 8 maks 60
masaBerlaku: wajib untuk halal dan spp_irt, harus tanggal >= hari ini saat unggah
masaSimpanBulan: wajib untuk uji_umur_simpan, integer 1..60
file: mime dalam ['application/pdf','image/jpeg'] (cek magic bytes dengan file-type), ukuran <= 2*1024*1024
```

---

## 8. PBI-03 — Kelola Produk (FR-03)

**PIC:** Fariz | **SP:** 5 | **Aktor:** UMKM

### 8.1 User Story

> **Sebagai** pelaku UMKM, **saya ingin** menambah dan mengelola produk beserta foto dan kapasitas produksi bulanan,  
> **agar** produk saya bisa diajukan kurasi dan ikut pesanan besar.

### 8.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-03-01 | Halaman "Produk Saya" menampilkan tabel produk dengan foto, nama, kategori, kapasitas, badge status | Hanya produk milik UMKM yang login |
| AC-03-02 | Form produk: nama, varian (opsional, chip), kategori, sub-komoditas, satuan, harga acuan, kapasitas produksi per bulan, deskripsi keunggulan lokal, foto | Semua field tervalidasi |
| AC-03-03 | Kategori produk harus sama dengan kategori utama usaha | Dropdown otomatis terisi dan terkunci |
| AC-03-04 | Foto maksimal 5 per produk, input maksimal 5 MB (jpg/png/webp) per foto | Foto ke-6 ditolak |
| AC-03-05 | Server mengompresi setiap foto menjadi WebP **di bawah 300 KB** (lebar maksimal 1200 px) dan membuat thumbnail 400 px | Ukuran akhir tersimpan di database dan di bawah 300 KB |
| AC-03-06 | Form menampilkan teks "Foto otomatis dikompresi di bawah 300 KB" dan pratinjau foto sebelum disimpan | Teks dan pratinjau tampil |
| AC-03-07 | Tombol "Simpan Draf" menyimpan dengan status `draf` tanpa syarat kelengkapan | Draf bisa tersimpan setengah isi |
| AC-03-08 | Tombol "Ajukan Kurasi" hanya aktif jika akun `aktif`, ada minimal 1 foto, dan dokumen wajib kategori sudah diunggah (status verifikasi tidak diperiksa di sini) | Jika belum, pesan menyebutkan dokumen yang kurang |
| AC-03-09 | Setelah diajukan, status produk `menunggu_verifikasi` dan produk terkunci dari penyuntingan | Edit ditolak 409 |
| AC-03-10 | Produk berstatus `perlu_revisi` tampil dengan catatan verifikator dan tombol "Perbaiki" | Catatan diambil dari kurasi terbaru |
| AC-03-11 | Produk `terkurasi` hanya boleh mengubah harga acuan, kapasitas bulanan, dan deskripsi | Perubahan nama, sub-komoditas, foto ditolak 409 |
| AC-03-12 | Produk berstatus `draf` dapat dihapus; produk lain tidak bisa | Hapus produk non-draf 409 |
| AC-03-13 | UMKM berstatus `menunggu_persetujuan` dapat membuat draf tetapi tidak dapat mengajukan kurasi | Tombol ajukan nonaktif dengan penjelasan |

### 8.3 Logika

**Kompresi foto (Sharp):**
```js
// utils/files.js
export async function compressPhoto(buffer) {
  let quality = 80;
  let out;
  do {
    out = await sharp(buffer).rotate().resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality }).toBuffer();
    quality -= 10;
  } while (out.length > 300 * 1024 && quality >= 40);
  if (out.length > 300 * 1024) throw new AppError('Foto terlalu besar untuk dikompresi', 422);
  return out;
}
```

**Aturan status produk (state machine):**

```
draf --[ajukan]--> menunggu_verifikasi --[kurasi: revisi]--> perlu_revisi --[perbaiki + ajukan ulang]--> menunggu_verifikasi
                                        \--[kurasi: kabid setuju]--> terkurasi
```
Perubahan status ke `perlu_revisi` dan `terkurasi` dilakukan oleh `kurasiService` (PBI-04). Modul produk hanya mengubah `draf -> menunggu_verifikasi` (lewat `kurasiService.createSubmission`).

**Normalisasi sub-komoditas:** `subKomoditasSlug = slugify(subKomoditas)` (huruf kecil, spasi menjadi `-`). Dipakai Sprint 2 untuk mencocokkan RFQ dengan produk.

### 8.4 Skema Database

```js
// models/Product.js
{
  businessId: ObjectId (ref BusinessProfile, required, index),
  nama: String (required, 5..120),
  varian: [String],
  kategori: { type: String, enum: Object.values(KATEGORI), required: true },
  subKomoditas: String (required),
  subKomoditasSlug: String (index),
  satuan: String (required),              // 'lembar', 'pak', 'kemasan', 'botol'
  hargaAcuan: Number (required, min 1000),
  kapasitasBulanan: Number (required, min 1),   // dalam satuan produk
  deskripsi: String (required, min 30),
  fotos: [{ path: String, thumb: String, ukuran: Number, urutan: Number }],
  statusKurasi: { type: String, enum: STATUS_PRODUK, default: 'draf', index: true },
  gradeKurasi: { type: String, enum: GRADE },
  terkurasiAt: Date, nomorSK: String,
  timestamps: true
}
```

### 8.5 Endpoint

```
GET    /products/mine                    umkm
POST   /products                         umkm (requireActiveUmkm tidak wajib untuk draf)
GET    /products/:id                     umkm (pemilik)
PUT    /products/:id                     umkm (aturan AC-03-11)
DELETE /products/:id                     umkm (hanya draf)
POST   /products/:id/foto                umkm (multipart, field 'fotos', maks 5)
DELETE /products/:id/foto/:urutan        umkm
POST   /products/:id/ajukan-kurasi       umkm (requireActiveUmkm) -> kurasiService.createSubmission
```

### 8.6 Validasi

```js
nama: z.string().min(5).max(120)
kategori: harus sama dengan BusinessProfile.kategoriUtama
subKomoditas: z.string().min(3).max(40)
satuan: z.enum(['lembar','pak','kemasan','botol','pcs','kg'])
hargaAcuan: z.number().int().min(1000).max(100_000_000)
kapasitasBulanan: z.number().int().min(1).max(100_000)
deskripsi: z.string().min(30).max(1000)
varian: z.array(z.string().min(1).max(40)).max(10).optional()
```

### 8.7 Tampilan UI

```
PRODUK SAYA                                            [+ Tambah Produk]
+------+---------------------------+----------+----------+--------------------+--------+
| Foto | Nama                      | Kapasitas| Harga    | Status             | Aksi   |
+------+---------------------------+----------+----------+--------------------+--------+
| [img]| Tenun Ikat Baduy Suat ... | 45/bln   | 350.000  | Terkurasi Dinas    | Ubah   |
| [img]| Gula Aren Cetak 250g      | 400/bln  | 15.000   | Perlu Revisi       | Perbaiki|
|      | Catatan: label belum memuat komposisi                                  |
+------+---------------------------+----------+----------+--------------------+--------+
```

---

## 9. PBI-04 — Pengajuan dan Verifikasi Kurasi (FR-04)

**PIC:** Abdullah | **SP:** 5 | **Aktor:** UMKM (mengajukan), Staf (memeriksa), Kabid (memutuskan)

### 9.1 User Story

> **Sebagai** staf dinas, **saya ingin** memeriksa berkas dan mutu produk dalam tahapan yang jelas lalu memberi rekomendasi,  
> **agar** pimpinan hanya memutuskan produk yang sudah layak.

> **Sebagai** kepala bidang, **saya ingin** memberi persetujuan akhir dan menerbitkan lencana beserta grade,  
> **agar** lencana "Terkurasi Dinas" benar-benar bisa dipertanggungjawabkan.

> **Sebagai** pelaku UMKM, **saya ingin** tahu bagian mana yang harus diperbaiki jika produk dikembalikan,  
> **agar** saya bisa memperbaikinya dan mengajukan ulang.

### 9.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-04-01 | Saat UMKM menekan "Ajukan Kurasi", sistem membuat pengajuan baru dengan kode `KUR-{tahun}-{seq3}` | Kode unik, status `menunggu_verifikasi` |
| AC-04-02 | Satu produk hanya boleh punya satu pengajuan aktif (belum `disetujui`) | Pengajuan kedua ditolak 409 |
| AC-04-03 | Antrean `staf` menampilkan pengajuan berstatus `menunggu_verifikasi` dan `dalam_pemeriksaan`: kode, UMKM, kecamatan, produk, tanggal, status, tombol "Periksa" | Filter status, pencarian, paginasi |
| AC-04-04 | Staf menekan "Ambil Pengajuan" sebelum memeriksa; pengajuan yang sudah diambil staf lain hanya bisa dibuka (baca saja) kecuali oleh `kabid` | Dua staf tidak bisa mengisi pengajuan yang sama |
| AC-04-05 | Halaman detail menampilkan stepper 4 tahap: (1) Profil Usaha dan Kecamatan, (2) Berkas Izin, (3) Umur Simpan dan Kemasan, (4) Keputusan | Tahap selesai berborder navy, aktif amber lembut |
| AC-04-06 | Tahap 1: staf menandai kebenaran profil usaha (nama, kecamatan, alamat, NIB cocok dengan berkas) | Status `valid` atau `perlu_revisi` + catatan |
| AC-04-07 | Tahap 2: staf memeriksa dokumen sesuai kategori; setiap dokumen punya tombol pratinjau dan status `valid` / `perlu_revisi` / `tidak_valid`; perubahan status memanggil `PATCH /documents/:id/verifikasi` | Status dokumen dan hasil kurasi konsisten |
| AC-04-08 | Tahap 3: staf menilai `uji_umur_simpan` (khusus pangan) dan `kemasan_label` dari foto produk | Status per butir + catatan |
| AC-04-09 | Butir yang tidak berlaku untuk kategori ditandai `na` otomatis dan tidak dihitung | Kriya tidak diminta SPP-IRT/Halal/uji umur simpan |
| AC-04-10 | Staf memberi rekomendasi: `setuju` hanya jika **semua butir wajib** berstatus `valid` (atau `na`); selain itu tombol Setuju nonaktif | Validasi server mengulang pengecekan |
| AC-04-11 | Rekomendasi `revisi` wajib menyertakan minimal satu butir bermasalah dan catatan; pengajuan langsung `perlu_revisi` dan produk menjadi `perlu_revisi` | UMKM melihat daftar butir dan catatan |
| AC-04-12 | Rekomendasi `setuju` memindahkan pengajuan ke `menunggu_approval` dan masuk antrean `kabid` | `kabid` melihat di daftar "Menunggu Persetujuan" |
| AC-04-13 | `staf` yang memanggil endpoint keputusan akhir mendapat 403 | Diuji lewat tes role |
| AC-04-14 | `kabid` menyetujui: sistem menghitung grade otomatis, `kabid` boleh **menurunkan** (A ke B) tetapi tidak menaikkan | Grade tersimpan, nomor SK dibuat |
| AC-04-15 | Setelah disetujui: pengajuan `disetujui`, produk `terkurasi`, `gradeKurasi`, `terkurasiAt`, `nomorSK` terisi, produk muncul di katalog publik | Terlihat di PBI-05 |
| AC-04-16 | `kabid` dapat mengembalikan ke UMKM dengan modal "Catatan Revisi" (checklist butir + catatan wajib), tombol aksi merah "Kirim Catatan Revisi ke UMKM" | Status `perlu_revisi` |
| AC-04-17 | UMKM mengajukan ulang setelah memperbaiki; nomor putaran (`putaran`) bertambah dan riwayat tidak terhapus | Riwayat berisi semua putaran |
| AC-04-18 | Setiap perubahan status tercatat di `riwayat` pengajuan dan di audit log | Siapa, kapan, apa |
| AC-04-19 | UMKM melihat status pengajuan, tahap, dan catatan revisi di halaman "Produk Saya" | Data konsisten dengan PBI-03 |

### 9.3 Logika

**State machine pengajuan kurasi:**

```
menunggu_verifikasi --[staf: ambil]--> dalam_pemeriksaan
dalam_pemeriksaan --[staf: rekomendasi revisi]--> perlu_revisi
dalam_pemeriksaan --[staf: rekomendasi setuju]--> menunggu_approval
menunggu_approval --[kabid: setuju]--> disetujui
menunggu_approval --[kabid: revisi]--> perlu_revisi
perlu_revisi --[umkm: ajukan ulang]--> menunggu_verifikasi   (putaran + 1)
```

**Butir pemeriksaan (5 butir) dan tahap:**

| Tahap | Butir (`kunci`) | Wajib untuk |
|-------|-----------------|-------------|
| 1 | `profil` | semua |
| 2 | `nib` | semua |
| 2 | `spp_irt`, `halal` | `olahan_pangan` (kriya = `na`) |
| 3 | `uji_umur_simpan` | `olahan_pangan` (kriya = `na`) |
| 3 | `kemasan_label` | semua |
| (opsional) | `hak_merek` | tidak wajib, hanya memengaruhi grade kriya |

**Perhitungan grade (fungsi murni, wajib punya unit test):**

```js
// modules/kurasi/grade.js
export function hitungGrade({ kategori, checks, masaSimpanBulan }) {
  const ok = (k) => checks[k] === 'valid';
  const dasar = ok('profil') && ok('nib') && ok('kemasan_label');

  if (kategori === 'kriya_tenun') {
    if (!dasar) return null;                         // tidak layak
    return ok('hak_merek') ? 'A' : 'B';
  }
  // olahan_pangan
  if (!(dasar && ok('spp_irt'))) return null;
  const siapRitel = ok('halal') && ok('uji_umur_simpan') && masaSimpanBulan >= 12;
  return siapRitel ? 'A' : 'B';
}
```

| Grade | Arti | Syarat ringkas |
|-------|------|----------------|
| A | Siap ritel modern | Pangan: semua butir valid dan umur simpan minimal 12 bulan. Kriya: dasar valid + hak merek valid |
| B | Layak katalog, Plaza Lebak, dan pameran | Dasar valid (+ SPP-IRT valid untuk pangan) |
| (null) | Belum layak | Syarat dasar belum terpenuhi, tidak boleh disetujui |

Kriteria grade ini usulan dan perlu dikonfirmasi ke dinas (keputusan K-05).

**Pengambilan pengajuan (claim):** `findOneAndUpdate({ _id, assignedTo: null, status: 'menunggu_verifikasi' }, { assignedTo: staf, status: 'dalam_pemeriksaan' })`. Jika hasil `null`, kembalikan 409 "Pengajuan sudah diambil staf lain". `kabid` dapat memindahkan (reassign) pengajuan.

**Integritas dokumen:** saat `rekomendasi=setuju`, server membaca ulang `LegalDocument` terkait dan memastikan status dokumen wajib masih `valid`. Bila ada yang berubah sejak tahap 2, rekomendasi ditolak 409.

### 9.4 Skema Database

```js
// models/KurasiSubmission.js
{
  kode: String (unique),                              // KUR-2026-084
  productId: ObjectId (ref Product, required, index),
  businessId: ObjectId (ref BusinessProfile, required),
  status: { type: String, enum: STATUS_KURASI, default: 'menunggu_verifikasi', index: true },
  tahapAktif: { type: Number, min: 1, max: 4, default: 1 },
  putaran: { type: Number, default: 1 },
  assignedTo: ObjectId (ref User),
  checks: {                                           // status per butir
    profil:          { status: String, catatan: String },
    nib:             { status: String, catatan: String },
    spp_irt:         { status: String, catatan: String },
    halal:           { status: String, catatan: String },
    uji_umur_simpan: { status: String, catatan: String },
    kemasan_label:   { status: String, catatan: String },
    hak_merek:       { status: String, catatan: String }
  },        // status: 'belum' | 'valid' | 'perlu_revisi' | 'tidak_valid' | 'na'
  rekomendasi: { hasil: String, catatan: String, oleh: ObjectId, at: Date },
  keputusan: { hasil: String, grade: String, catatan: String, nomorSK: String,
               oleh: ObjectId, at: Date },
  riwayat: [{ at: Date, oleh: ObjectId, aksi: String, dariStatus: String,
              keStatus: String, catatan: String, putaran: Number }],
  timestamps: true
}
// index unik parsial: { productId: 1 } where status != 'disetujui'  -> satu pengajuan aktif per produk
```

### 9.5 Endpoint

```
GET   /kurasi                       staf, kabid   ?status=&q=&page=
GET   /kurasi/mine                  umkm
GET   /kurasi/:id                   staf, kabid, umkm(pemilik)
POST  /kurasi/:id/ambil             staf, kabid
PATCH /kurasi/:id/tahap/:n          staf, kabid   body: { items: [{ kunci, status, catatan }] }, n = 1..3
POST  /kurasi/:id/rekomendasi       staf, kabid   body: { hasil: 'setuju'|'revisi', catatan, butirRevisi: [] }
POST  /kurasi/:id/keputusan         kabid         body: { hasil: 'setuju'|'revisi', grade, catatan, butirRevisi: [] }
POST  /kurasi/:id/ajukan-ulang      umkm(pemilik)
```

`kurasiService.createSubmission(productId, userId)` dipanggil dari `POST /products/:id/ajukan-kurasi`.

### 9.6 Tampilan UI

```
DETAIL KURASI  KUR-2026-084                        [Setujui & Terbitkan Lencana]  (hanya kabid)
[1 Profil: selesai] [2 Berkas: selesai] [3 Umur simpan & kemasan: selesai] [4 Keputusan: aktif]
+--------------------------------------------+  +--------------------------+
| Dokumen                                    |  | Identitas UMKM           |
| NIB        9120300451830  [Pratinjau] Valid|  | KUB Aren Jaya Sobang     |
| SPP-IRT    P-IRT No. ...  [Pratinjau] Valid|  | Kec. Sobang              |
| Halal      ID3611...      [Pratinjau] Valid|  | Pangan olahan            |
| Uji umur simpan 12 bulan  [Pratinjau] Valid|  | Kapasitas 600/bulan      |
| Kemasan & label           Valid            |  | Grade usulan sistem: A   |
| Catatan staf: [________________________ ]  |  | [Kembalikan ke UMKM]     |
+--------------------------------------------+  +--------------------------+
```

Modal "Kembalikan Berkas untuk Revisi UMKM": judul, sub-judul produk dan UMKM, checklist butir bermasalah, textarea catatan, tombol Batal dan "Kirim Catatan Revisi ke UMKM" (merah).

---

## 10. PBI-05 — Katalog Produk Terkurasi (FR-05)

**PIC:** Fariz | **SP:** 3 | **Aktor:** Publik, `umkm`, `staf`, `kabid`, `mitra`

### 10.1 User Story

> **Sebagai** calon pembeli atau mitra, **saya ingin** menelusuri produk UMKM Lebak yang sudah lolos kurasi dinas,  
> **agar** saya yakin produk itu legal dan layak dibeli atau dipesan.

### 10.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-05-01 | Katalog dapat dibuka **tanpa login** | Tidak ada redirect ke login |
| AC-05-02 | Hanya produk berstatus `terkurasi` yang tampil | Produk draf, menunggu, revisi tidak pernah muncul |
| AC-05-03 | Grid kartu 3 kolom (desktop) dan 1 kolom (ponsel): foto, nama, UMKM, kecamatan, harga acuan, badge "Terkurasi Dinas" dan grade | Foto memakai thumbnail |
| AC-05-04 | Pencarian teks (nama produk, deskripsi, nama UMKM) | Hasil sesuai kata kunci, tidak peka huruf besar |
| AC-05-05 | Filter: kategori, kecamatan (28), grade; urutan: terbaru, harga terendah, harga tertinggi | Kombinasi filter berfungsi |
| AC-05-06 | Paginasi 12 produk per halaman | Parameter `page` bekerja |
| AC-05-07 | Halaman detail: foto besar (galeri), nama, harga, kapasitas bulanan, lencana + grade + tanggal kurasi, deskripsi, profil singkat UMKM | Data lengkap |
| AC-05-08 | Detail menampilkan daftar izin yang dimiliki (NIB, P-IRT, Halal, HKI) sebagai **label ada/tidak**, tanpa nomor dan tanpa berkas | Tidak ada nomor atau file dokumen di respons |
| AC-05-09 | Tombol "Hubungi UMKM" menampilkan nomor WA usaha **hanya untuk pengguna yang login**; pengunjung diarahkan masuk | Nomor tidak ada di respons publik |
| AC-05-10 | Tombol "Ajukan Permintaan Pesanan" tampil hanya untuk `mitra` dan mengarah ke `/mitra/rfq/buat?komoditas={slug}` (dikerjakan Sprint 2) | Untuk Sprint 1 tombol menuju halaman placeholder |
| AC-05-11 | Keadaan kosong: pesan "Belum ada produk yang sesuai filter" dengan tombol reset filter | Tidak ada halaman kosong tanpa penjelasan |
| AC-05-12 | Halaman katalog selesai dimuat dalam 3 detik di jaringan 3G terkompresi | Foto lazy-load |

### 10.3 Logika

**Query katalog (aggregation):**
```js
Product.aggregate([
  { $match: { statusKurasi: 'terkurasi', ...(kategori && { kategori }) , ...(grade && { gradeKurasi: grade }) } },
  { $lookup: { from: 'businessprofiles', localField: 'businessId', foreignField: '_id', as: 'usaha' } },
  { $unwind: '$usaha' },
  ...(kecamatan ? [{ $match: { 'usaha.kecamatan': kecamatan } }] : []),
  ...(q ? [{ $match: { $or: [
      { nama: rx(q) }, { deskripsi: rx(q) }, { 'usaha.namaUsaha': rx(q) } ] } }] : []),
  { $sort: sortSpec },
  { $facet: { items: [{ $skip }, { $limit }], total: [{ $count: 'n' }] } },
]);
```
`rx(q)` = `new RegExp(escapeRegex(q), 'i')`.

**DTO publik (`toPublicProduct`)** hanya memuat: `id`, `nama`, `kategori`, `subKomoditas`, `satuan`, `hargaAcuan`, `kapasitasBulanan`, `deskripsi`, `fotos[].thumb/path publik`, `gradeKurasi`, `terkurasiAt`, `usaha { namaUsaha, kecamatan, kategoriUtama, tahunMulai }`, `izin { nib: bool, spp_irt: bool, halal: bool, hak_merek: bool }`. `izin.X = true` jika dokumen jenis itu berstatus `valid`.

### 10.4 Endpoint

```
GET /catalog/products             publik   ?q=&kategori=&kecamatan=&grade=&sort=&page=&limit=
GET /catalog/products/:id         publik
GET /catalog/filters              publik   -> daftar kecamatan yang punya produk + jumlah, sub-komoditas
GET /catalog/products/:id/kontak  login    -> { waUsaha }   (selain publik)
```

Tidak ada skema database baru; memakai `Product`, `BusinessProfile`, dan `LegalDocument`.

---

## 11. PBI-06 — Direktori UMKM, Persetujuan Akun, Daftar UMKM Manual (FR-14)

**PIC:** Naila | **SP:** 3 (usulan, FR-14 belum diestimasi tim) | **Aktor:** Staf dan Kabid

### 11.1 User Story

> **Sebagai** staf dinas, **saya ingin** melihat semua UMKM per kecamatan dan menyetujui akun baru,  
> **agar** data binaan terpusat dan hanya usaha yang valid yang aktif di sistem.

> **Sebagai** staf dinas, **saya ingin** mendaftarkan UMKM binaan yang literasi digitalnya rendah,  
> **agar** mereka tetap tercatat tanpa harus mendaftar sendiri.

### 11.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-06-01 | Tabel direktori menampilkan nama usaha, pemilik, kecamatan, kategori, status akun, jumlah produk, jumlah produk terkurasi | Paginasi 10 per halaman |
| AC-06-02 | Filter: kecamatan, kategori, status akun, ada tidaknya produk terkurasi; pencarian nama usaha atau NIB | Kombinasi filter berfungsi |
| AC-06-03 | Ringkasan jumlah UMKM per kecamatan (28 kecamatan) tampil di atas tabel | Angka sesuai data |
| AC-06-04 | Halaman detail UMKM: data usaha, daftar dokumen beserta status (pratinjau file lewat PBI-02), daftar produk dan status kurasi | Data lengkap dan terbaca staf/kabid saja |
| AC-06-05 | Antrean "Menunggu Persetujuan Akun" menampilkan akun `menunggu_persetujuan` urut tertua | Tombol "Periksa" |
| AC-06-06 | Staf dapat **menyetujui** akun hanya jika dokumen NIB sudah diunggah dan nomor NIB cocok | Jika belum, tombol Setujui nonaktif dengan alasan |
| AC-06-07 | Staf dapat **menolak** akun dengan catatan wajib; UMKM melihat alasan dan dapat memperbaiki lalu mengajukan ulang | Status `ditolak`, tombol "Ajukan Ulang" di sisi UMKM |
| AC-06-08 | Persetujuan atau penolakan tercatat di audit log dan mengisi `verifiedBy`, `verifiedAt` | Entri audit tersimpan |
| AC-06-09 | "Daftarkan UMKM Manual": staf mengisi data pemilik dan usaha (tanpa wizard); akun langsung `aktif`, `createdVia = 'dinas'`, kata sandi sementara dibuat otomatis dan `mustChangePassword = true` | Kata sandi sementara ditampilkan **sekali** untuk diberikan ke UMKM |
| AC-06-10 | Ekspor Excel (`.xlsx`) mengikuti filter yang aktif | Berkas terunduh dengan kolom sesuai tabel |
| AC-06-11 | Semua endpoint hanya untuk `staf` dan `kabid`; `umkm` dan `mitra` mendapat 403 | Diuji lewat tes role |

### 11.3 Logika

- Persetujuan akun: `PATCH /umkm/:id/persetujuan` dengan `{ keputusan: 'setuju' | 'tolak', catatan }`. Server memeriksa keberadaan `LegalDocument` jenis `nib`; jika tidak ada, 409.
- UMKM yang ditolak dapat mengubah profil dan dokumen, lalu menekan "Ajukan Ulang" (`POST /profil/saya/ajukan-ulang`) yang mengembalikan status ke `menunggu_persetujuan`.
- Kata sandi sementara: 10 karakter acak (huruf dan angka), hanya hash yang disimpan.
- Pembuatan akun manual memakai fungsi pembuat user yang sama dengan registrasi (`authService.createUmkmAccount`), supaya validasi unik NIB dan email konsisten.
- Ringkasan per kecamatan: aggregation `BusinessProfile` dikelompokkan per `kecamatan`, ditambah `$lookup` ke `User` untuk status akun.

### 11.4 Endpoint

```
GET   /umkm                         staf, kabid   ?kecamatan=&kategori=&statusAkun=&terkurasi=&q=&page=
GET   /umkm/summary                 staf, kabid   -> jumlah per kecamatan
GET   /umkm/pending                 staf, kabid
GET   /umkm/export                  staf, kabid   -> .xlsx
GET   /umkm/:id                     staf, kabid
POST  /umkm                         staf, kabid   -> daftar manual
PATCH /umkm/:id/persetujuan         staf, kabid
POST  /profil/saya/ajukan-ulang     umkm (status ditolak)
```

Tidak ada skema baru; memakai `User` dan `BusinessProfile` dari PBI-01.

---

## 12. Kebutuhan Non-Fungsional Sprint 1

| Aspek | Target |
|-------|--------|
| Waktu respons halaman | 3 detik atau kurang pada jaringan seluler lambat |
| Responsif | Mobile-first, diuji di lebar 360 px dan 1280 px |
| Ukuran foto | Maksimal 300 KB per foto setelah kompresi |
| Keamanan dokumen | Hanya pemilik, `staf`, `kabid`; kata sandi di-hash; UU PDP No. 27/2022 |
| Bahasa | Seluruh teks UI Bahasa Indonesia, pesan error spesifik |
| Konsistensi UI | Tailwind dengan komponen `components/ui/*`; tanpa emoji, tanpa gradien, warna navy `#0F2A4F`, hijau `#16A34A`, amber `#F59E0B`, merah `#DC2626` |
| Error handling | Flash message sukses/gagal; form tidak ter-reset saat error |
| Biaya | Tidak memakai layanan berbayar tinggi |

---

## 13. Out of Scope Sprint 1

- RFQ, agregasi kuota, PO Summary (Sprint 2)
- Event, forum, Sintesa, dasbor analitik, manajemen akun lengkap (Sprint 3)
- Integrasi OSS-RBA otomatis (NIB diperiksa manual oleh staf)
- Notifikasi email selain reset kata sandi
- Pencabutan lencana kurasi dan masa berlaku lencana
- Aplikasi native

---

## 14. Definition of Done (DoD)

Sebuah PBI selesai jika:

- [ ] Semua Acceptance Criteria terpenuhi
- [ ] Kode di-push ke branch fitur dan di-merge ke `develop` lewat pull request yang direview satu anggota lain
- [ ] Tidak ada error fatal di lingkungan lokal; `npm run seed` berjalan dari database kosong
- [ ] Fitur berjalan dengan seed data Seksi 5
- [ ] Validasi input dan pesan error sesuai spesifikasi
- [ ] Hak akses diuji: setiap role yang tidak diizinkan mendapat 403/401
- [ ] Tidak ada data sensitif (hash sandi, path file privat, nomor dokumen untuk publik) yang bocor di respons
- [ ] UI konsisten dengan design system dan tanpa emoji
- [ ] Tes Black-Box dasar ditulis (minimal: jalur sukses, input tidak valid, role tidak berhak)

---

## 15. Keputusan Terbuka (sudah diberi nilai bawaan agar coding tidak tertahan)

| ID | Pertanyaan | Nilai bawaan yang dipakai di PRD ini | Perlu dikonfirmasi ke |
|----|-----------|---------------------------------------|----------------------|
| K-01 | MongoDB atau database relasional? Proposal memuat NFR relasional untuk konsistensi kuota, sementara stack MERN memakai MongoDB | MongoDB. Konsistensi kuota dijaga lewat update atomik satu dokumen (lihat PRD Sprint 2) | Tim dan dosen pembimbing |
| K-02 | Siapa menyetujui akun UMKM dan apa yang boleh sebelum disetujui? | `staf` menyetujui; sebelum disetujui hanya boleh melengkapi profil, dokumen, dan draf produk | Ibu Juli |
| K-03 | NIB diverifikasi otomatis lewat OSS atau manual? | Manual oleh staf | Ibu Juli |
| K-04 | Apakah kurasi dua tingkat (staf lalu kabid)? | Ya. Staf merekomendasikan, hanya `kabid` yang menerbitkan lencana dan SK | Ibu Juli |
| K-05 | Kriteria grade A dan B | Seperti tabel di 9.3 | Ibu Juli |
| K-06 | Apakah katalog tetap publik tanpa login? | Ya. Nomor WA hanya untuk pengguna login | Tim |
| K-07 | Peran Konsultan PLUT dan Super Admin | Digabung: konsultan menjadi `staf`, admin menjadi `kabid` | Tim |
| K-08 | Layanan penyimpanan berkas | Folder lokal terproteksi saat development; siapkan antarmuka `storage` agar mudah diganti ke penyimpanan objek | Tim |
| K-09 | Jadwal sprint tidak konsisten antara Bab III dan Bab IV | Satu jadwal acuan harus disepakati tim sebelum Sprint 1 dimulai | Tim |

---

## 16. Referensi

- Proposal Capstone SIPK-Lebak (Bab I sampai IV), Tabel Product Backlog
- PRD draf v0.2 SIPK-Lebak (FR-01 sampai FR-14)
- Desain UI SIPK-Lebak (Figma dan screen Stitch)
- Transkrip wawancara Kepala Bidang UMKM Dinkop UKM Kabupaten Lebak
