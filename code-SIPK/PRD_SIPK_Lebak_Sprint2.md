# Product Requirements Document (PRD)
## SIPK-Lebak — Sprint 2: RFQ, Agregasi Kuota, dan PO Summary

**Versi:** 1.0  
**Kelompok:** Capstone Design Project, S1 Sistem Informasi, Telkom University  
**Tim:** Naila Hafidz Bachtiar, Muhammad Fariz Eka Putra, Abdullah Muchtar Rasyid  
**Jadwal:** mengikuti jadwal acuan tim (lihat PRD Sprint 1, keputusan K-09)

> PRD ini melanjutkan **PRD Sprint 1**. Seksi 4 PRD Sprint 1 (struktur proyek, konvensi API, enum, middleware, penomoran, audit log, kepemilikan file, aturan git) **tetap berlaku** dan tidak diulang di sini. Ringkasan yang dibutuhkan ada di Seksi 3 dokumen ini.

---

## 1. Ringkasan Sprint

Sprint 2 membuat **pemenuhan pesanan besar secara kolektif**. Mitra Pembeli membuat permintaan pesanan (RFQ), dinas memverifikasinya, UMKM terkurasi mengambil porsi kuota sesuai kapasitas, dan saat total kuota mencapai 100% sistem menerbitkan dokumen **Purchase Order Summary (PDF)**.

**Aktor:** `mitra`, `umkm` (hanya yang punya produk `terkurasi`), `staf`, `kabid`. Aktor sama seperti Sprint 1 (maksimal 4).

**Prasyarat dari Sprint 1 (sekarang sudah nyata, bukan dummy):** autentikasi dan RBAC, `BusinessProfile`, `Product` dengan `statusKurasi = 'terkurasi'`, `subKomoditasSlug`, `kapasitasBulanan`.

---

## 2. Scope Sprint 2

Sprint 2 mencakup **FR-06, FR-07, dan FR-08** (16 SP dari proposal). FR-06 dan FR-07 dipecah agar tiga orang bisa bekerja bersamaan.

| PBI | Nama Fitur | FR | PIC (usulan) | SP |
|-----|-----------|----|--------------|----|
| PBI-07 | Formulir RFQ oleh Mitra (draf dan ajukan) | FR-06 bagian A | Naila | 3 |
| PBI-08 | Verifikasi RFQ oleh Staf dan harga acuan | FR-06 bagian B | Abdullah | 2 |
| PBI-09 | Mesin agregasi kuota (logika atomik) | FR-07 bagian A | Fariz | 5 |
| PBI-10 | Daftar RFQ terbuka, detail, dan layar ambil kuota (UMKM) | FR-07 bagian B | Naila | 3 |
| PBI-11 | PO Summary PDF | FR-08 | Abdullah | 3 |

Beban: Naila 6 SP, Fariz 5 SP, Abdullah 5 SP.

---

## 3. Ringkasan Kontrak Bersama (dari PRD Sprint 1)

- Prefix API `/api/v1`; sukses `{ success, data, message }`; gagal `{ success:false, error:{ code, message, fields } }`.
- Role: `umkm`, `staf`, `kabid`, `mitra`. `authorize('staf')` meloloskan `kabid`.
- Middleware: `authenticate`, `authorize(...)`, `requireActiveUmkm` (mengisi `req.businessId`).
- Nomor dokumen lewat `generateCode`: RFQ `RFQ-{tahun}-{seq3}` dan PO `PO-RFQ/{tahun}/{romawiBulan}/{seq3}`.
- Setiap perubahan status penting memanggil `auditLog.write(...)`.
- Uang berupa bilangan bulat Rupiah; tanggal UTC di database, tampil WIB.
- Kepemilikan file: tiap PBI hanya mengubah modulnya sendiri (lihat 3.1).

### 3.1 Kepemilikan file Sprint 2

| Area | Pemilik |
|------|---------|
| `modules/rfq/*` (routes, controller, service untuk pembuatan dan daftar RFQ), `models/RFQ.js`, halaman `pages/mitra/rfq/*`, `pages/umkm/rfq/*` | Naila |
| `modules/rfq-verification/*`, `modules/reference-price/*`, `models/ReferencePrice.js`, halaman `pages/dinas/rfq/*` | Abdullah |
| `modules/quota/*` (service agregasi), `models/RFQAllocation.js` | Fariz |
| `modules/po/*`, `models/PurchaseOrder.js`, halaman `pages/shared/po/*` | Abdullah |

### 3.2 Kontrak antar-PBI Sprint 2

| Disediakan oleh | Nama | Dipakai oleh | Keterangan |
|-----------------|------|--------------|------------|
| Naila (PBI-07) | Model `RFQ` (skema di 5.4) | Semua | Dibuat hari pertama dan di-merge lebih dulu |
| Fariz (PBI-09) | `quotaService.takeQuota({ rfqId, businessId, productId, jumlah, tanggalPerkiraanSelesai, userId })` | Naila (PBI-10) | Mengembalikan alokasi yang dibuat atau melempar `AppError` |
| Fariz (PBI-09) | `quotaService.cancelAllocation({ allocationId, userId, byStaf })` | Naila (PBI-10), Abdullah (PBI-08) | Mengurangi kuota terkumpul secara atomik |
| Fariz (PBI-09) | `quotaService.getCapacityInfo({ businessId, productId, rfqId })` | Naila (PBI-10) | `{ kapasitasBulanan, terpakaiBulanIni, tersisaBulanIni, sisaKuotaRfq }` |
| Abdullah (PBI-08) | `rfqVerificationService.approveFinal(rfqId, stafId)` | Abdullah (PBI-11) | Menerbitkan PO lewat `poService.generate` |
| Abdullah (PBI-11) | `poService.generate(rfqId, userId)` | Abdullah (PBI-08) | Idempoten: kedua kali dipanggil mengembalikan PO yang sama |
| Abdullah (PBI-08) | `ReferencePrice` dan `GET /reference-prices/:slug` | Naila (PBI-07) | Harga acuan otomatis di form mitra |

Selama service belum merge, pemanggil memakai stub dengan tanda tangan yang sama.

---

## 4. Dependensi dan Dummy Data Sprint 2

### 4.1 Seed harga acuan (`seeders/referencePriceSeeder.js`, Abdullah)

| `subKomoditasSlug` | Nama komoditas | Satuan | Harga acuan |
|--------------------|----------------|--------|-------------|
| `tenun-suat-songket` | Kain Tenun Ikat Baduy Motif Suat Songket | lembar | 350000 |
| `gula-aren-semut` | Gula Aren Semut Organik | pak | 28000 |
| `emping-melinjo` | Emping Melinjo | pak | 22000 |
| `keripik-pisang` | Keripik Pisang Kepok | pak | 15000 |

### 4.2 Seed produk terkurasi tambahan (untuk menguji agregasi, `seeders/rfqProductSeeder.js`)

Dibutuhkan minimal **3 UMKM aktif dengan produk `terkurasi` pada sub-komoditas yang sama** agar skenario RFQ 100 lembar bisa dites.

| UMKM | Produk | Slug | Kapasitas/bulan |
|------|--------|------|-----------------|
| UMKM Tenun Ambu Kanekes (Leuwidamar) | Tenun Ikat Baduy Motif Suat Songket | `tenun-suat-songket` | 45 lembar |
| Sanggar Tenun Baduy Luar (Leuwidamar) | Tenun Suat Songket Baduy Luar | `tenun-suat-songket` | 35 lembar |
| Tenun Pusaka Ciboleger (Leuwidamar) | Tenun Suat Songket Pusaka | `tenun-suat-songket` | 40 lembar |

Tambahkan juga 2 akun `umkm` aktif untuk dua UMKM terakhir (kata sandi `Password123!`).

### 4.3 Seed RFQ (`seeders/rfqSeeder.js`, Naila)

| Kode | Mitra | Komoditas | Volume | Status | Kuota terkumpul |
|------|-------|-----------|--------|--------|-----------------|
| `RFQ-2026-010` | Hotel & Konferensi Banten | Suat Songket | 100 lembar | `terbuka` | 70 (alokasi 40 + 30) |
| `RFQ-2026-011` | Hotel & Konferensi Banten | Gula Aren Semut | 500 pak | `menunggu_verifikasi` | 0 |
| `RFQ-2026-012` | Hotel & Konferensi Banten | Emping Melinjo | 100 pak | `draf` | 0 |
| `RFQ-2026-009` | Hotel & Konferensi Banten | Suat Songket | 50 lembar | `terpenuhi` + 1 PO | 50 |

---

## 5. PBI-07 — Formulir RFQ oleh Mitra (FR-06 bagian A)

**PIC:** Naila | **SP:** 3 | **Aktor:** `mitra`

### 5.1 User Story

> **Sebagai** mitra pembeli, **saya ingin** membuat permintaan pesanan besar untuk komoditas Lebak yang terkurasi,  
> **agar** pesanan saya bisa dipenuhi bersama oleh beberapa UMKM tanpa saya menghubungi mereka satu per satu.

### 5.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-07-01 | Mitra membuka form dari menu "Permintaan Pesanan (RFQ)" atau dari tombol di halaman detail produk katalog (komoditas terisi otomatis) | Dua pintu masuk berfungsi |
| AC-07-02 | Pilihan komoditas hanya berisi sub-komoditas yang punya minimal 1 produk `terkurasi` dengan UMKM `aktif` | Daftar dari `GET /rfq/komoditas` |
| AC-07-03 | Form: komoditas, volume total, satuan (otomatis dari komoditas), harga acuan dinas (hanya baca), tenggat pengisian kuota, lokasi kirim (teks), catatan spesifikasi mutu | Semua field tervalidasi |
| AC-07-04 | Harga acuan **tidak bisa diubah mitra**; nilainya diambil dari `ReferencePrice` dan disalin (snapshot) ke RFQ | Perubahan harga acuan setelah RFQ dibuat tidak mengubah RFQ lama |
| AC-07-05 | Sistem menampilkan estimasi kecukupan: jumlah UMKM terkurasi yang cocok dan total kapasitas bulanan mereka | Peringatan jika volume lebih besar dari total kapasitas, tetapi tetap boleh diajukan |
| AC-07-06 | Tenggat minimal 7 hari dari hari ini dan maksimal 90 hari | Validasi tanggal |
| AC-07-07 | "Simpan Draf" menyimpan RFQ berstatus `draf` tanpa syarat kelengkapan penuh (minimal komoditas) | Draf bisa dilanjutkan nanti |
| AC-07-08 | "Ajukan untuk Verifikasi" memindahkan status ke `menunggu_verifikasi`; RFQ terkunci dari penyuntingan | Edit ditolak 409 |
| AC-07-09 | Mitra melihat daftar RFQ miliknya dengan status, progres kuota, dan tombol sesuai status | Hanya RFQ milik mitra itu |
| AC-07-10 | RFQ `draf` dapat diubah dan dihapus; RFQ yang ditolak dapat diperbaiki dan diajukan ulang | Alur sesuai state machine 8.1 |
| AC-07-11 | Mitra dapat membatalkan RFQ yang `menunggu_verifikasi` atau `terbuka` (jika `terbuka`, semua alokasi menjadi `dibatalkan`) | Status `dibatalkan` dan kuota dikembalikan |
| AC-07-12 | Kode RFQ `RFQ-{tahun}-{seq3}` dibuat saat pertama kali disimpan | Kode unik |

### 5.3 Logika

**Daftar komoditas yang bisa dipesan:**
```js
Product.aggregate([
  { $match: { statusKurasi: 'terkurasi' } },
  { $lookup: { from: 'businessprofiles', localField: 'businessId', foreignField: '_id', as: 'u' } },
  { $unwind: '$u' },
  { $lookup: { from: 'users', localField: 'u.userId', foreignField: '_id', as: 'usr' } },
  { $unwind: '$usr' },
  { $match: { 'usr.status': 'aktif' } },
  { $group: { _id: '$subKomoditasSlug', nama: { $first: '$subKomoditas' }, satuan: { $first: '$satuan' },
              kategori: { $first: '$kategori' }, jumlahProduk: { $sum: 1 },
              jumlahUmkm: { $addToSet: '$businessId' }, totalKapasitas: { $sum: '$kapasitasBulanan' } } },
]);
```

**Harga acuan:** `ReferencePrice.findOne({ komoditasSlug })`. Jika tidak ada (komoditas baru), pakai rata-rata `Product.hargaAcuan` produk terkurasi komoditas itu, dibulatkan ke 500 terdekat, dan tandai `hargaAcuanSumber = 'rata_rata_produk'`.

**Estimasi kecukupan:** `totalKapasitas` dari agregasi di atas dibandingkan dengan volume yang diketik mitra; tampilkan tiga kondisi: cukup, sebagian, tidak cukup.

### 5.4 Skema Database

```js
// models/RFQ.js
{
  kode: { type: String, unique: true },                       // RFQ-2026-012
  mitraUserId: ObjectId (ref User, required, index),
  komoditasSlug: { type: String, required: true, index: true },
  komoditasNama: String (required),
  kategori: { type: String, enum: Object.values(KATEGORI), required: true },
  satuan: String (required),
  kuotaTotal: { type: Number, required: true, min: 1 },
  kuotaTerkumpul: { type: Number, default: 0, min: 0 },
  hargaAcuan: { type: Number, required: true },               // snapshot
  hargaAcuanSumber: { type: String, enum: ['referensi_dinas','rata_rata_produk'] },
  tenggat: { type: Date, required: true },
  lokasiKirim: String (required),
  catatanMutu: String,
  status: { type: String, required: true, default: 'draf', index: true,
            enum: ['draf','menunggu_verifikasi','ditolak','terbuka',
                   'proses_verifikasi','terpenuhi','kedaluwarsa','dibatalkan'] },
  verifikasi: { oleh: ObjectId, at: Date, catatan: String },
  tanggalPerkiraanSelesai: Date,                              // maksimum dari seluruh alokasi
  terpenuhiAt: Date,
  riwayat: [{ at: Date, oleh: ObjectId, aksi: String, dariStatus: String, keStatus: String, catatan: String }],
  timestamps: true
}
// validasi model: kuotaTerkumpul tidak boleh melebihi kuotaTotal
```

### 5.5 Endpoint

```
GET    /rfq/komoditas                  mitra       -> daftar komoditas + kapasitas agregat
GET    /rfq/mine                       mitra
POST   /rfq                            mitra       -> simpan draf
GET    /rfq/:id                        mitra(pemilik), staf, kabid, umkm(terkurasi, lihat 7.2)
PUT    /rfq/:id                        mitra(pemilik, hanya draf/ditolak)
DELETE /rfq/:id                        mitra(pemilik, hanya draf)
POST   /rfq/:id/ajukan                 mitra(pemilik)
POST   /rfq/:id/batalkan               mitra(pemilik)
```

### 5.6 Validasi

```js
komoditasSlug: z.string() // harus ada di daftar komoditas yang valid
kuotaTotal: z.number().int().min(10).max(100000)
tenggat: tanggal >= hari ini + 7 hari dan <= hari ini + 90 hari
lokasiKirim: z.string().min(10).max(200)
catatanMutu: z.string().max(500).optional()
```

---

## 6. PBI-08 — Verifikasi RFQ oleh Staf dan Harga Acuan (FR-06 bagian B)

**PIC:** Abdullah | **SP:** 2 | **Aktor:** `staf`, `kabid`

### 6.1 User Story

> **Sebagai** staf dinas (fasilitator), **saya ingin** memeriksa RFQ sebelum disebar ke UMKM dan memeriksa kembali saat kuota penuh,  
> **agar** UMKM hanya melihat permintaan yang jelas dan pesanan yang terpenuhi benar-benar siap.

### 6.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-08-01 | Antrean verifikasi RFQ menampilkan RFQ `menunggu_verifikasi` dan `proses_verifikasi`: kode, mitra, komoditas, volume, tenggat, status | Dua tab: "Menunggu Verifikasi" dan "Kuota Penuh, Menunggu Penerbitan PO" |
| AC-08-02 | Staf memeriksa kewajaran RFQ (volume, tenggat, spesifikasi mutu, kecukupan kapasitas) lalu memilih **Setujui dan Sebar** atau **Tolak dengan Catatan** | Catatan wajib saat menolak |
| AC-08-03 | **Setujui dan Sebar** mengubah status RFQ menjadi `terbuka` sehingga UMKM terkurasi yang cocok dapat melihatnya | RFQ tampil di PBI-10 |
| AC-08-04 | Staf boleh menyesuaikan harga acuan RFQ saat verifikasi (nilai baru tersimpan sebagai snapshot) dan alasan wajib diisi | Perubahan tercatat di riwayat |
| AC-08-05 | Pada tab "Kuota Penuh", staf melihat tabel semua alokasi (UMKM, produk, jumlah, estimasi selesai, nilai) | Total jumlah sama dengan `kuotaTotal` |
| AC-08-06 | Staf dapat **Setujui dan Terbitkan PO**: seluruh alokasi menjadi `terkonfirmasi`, RFQ menjadi `terpenuhi`, PO dibuat (PBI-11) | Satu PO per RFQ |
| AC-08-07 | Staf dapat membatalkan satu alokasi dengan alasan wajib; kuota terkumpul berkurang dan RFQ kembali `terbuka` jika sebelumnya `proses_verifikasi` | Kuota dan status konsisten |
| AC-08-08 | `staf` dan `kabid` sama-sama berhak verifikasi RFQ dan menerbitkan PO | Tidak ada langkah khusus `kabid` pada Sprint 2 |
| AC-08-09 | Staf mengelola daftar harga acuan resmi: tambah, ubah, lihat riwayat perubahan | Perubahan harga tidak memengaruhi RFQ yang sudah dibuat |
| AC-08-10 | Semua aksi tercatat di `RFQ.riwayat` dan audit log | Siapa, kapan, apa |

### 6.3 Logika

**State machine RFQ lengkap (sumber kebenaran Sprint 2):**

```
draf --[mitra: ajukan]--> menunggu_verifikasi
menunggu_verifikasi --[staf: setujui]--> terbuka
menunggu_verifikasi --[staf: tolak]--> ditolak --[mitra: perbaiki + ajukan]--> menunggu_verifikasi
terbuka --[kuota mencapai 100%, otomatis]--> proses_verifikasi
proses_verifikasi --[staf: batalkan 1 alokasi]--> terbuka
proses_verifikasi --[staf: setujui dan terbitkan PO]--> terpenuhi
terbuka --[tenggat lewat, otomatis]--> kedaluwarsa   (semua alokasi dibatalkan)
draf/menunggu_verifikasi/terbuka --[mitra: batalkan]--> dibatalkan
```

Aksi yang tidak sesuai status mengembalikan 409 `CONFLICT` dengan pesan yang menyebut status saat ini.

**Penerbitan akhir (`approveFinal`):**
1. Pastikan status RFQ `proses_verifikasi` dan `kuotaTerkumpul === kuotaTotal`.
2. Pastikan semua `RFQAllocation` berstatus `proses_verifikasi`.
3. Update status RFQ ke `terpenuhi` memakai filter status (`findOneAndUpdate({ _id, status: 'proses_verifikasi' }, ...)`) agar dua staf tidak menerbitkan dua kali.
4. Ubah semua alokasi ke `terkonfirmasi`, isi `terpenuhiAt`.
5. Panggil `poService.generate(rfqId, userId)`.

**Kedaluwarsa otomatis:** job `node-cron` setiap hari 00:05 WIB: untuk RFQ `terbuka` dengan `tenggat < sekarang`, ubah ke `kedaluwarsa` dan batalkan alokasi. Pengecekan yang sama dijalankan *lazy* saat RFQ dibaca, agar tampilan tidak menunggu jadwal job.

### 6.4 Skema Database

```js
// models/ReferencePrice.js
{
  komoditasSlug: { type: String, required: true, unique: true },
  komoditasNama: String (required),
  satuan: String (required),
  harga: { type: Number, required: true, min: 1000 },
  riwayat: [{ harga: Number, at: Date, oleh: ObjectId, alasan: String }],
  updatedBy: ObjectId (ref User),
  timestamps: true
}
```

### 6.5 Endpoint

```
GET   /rfq-verifikasi                       staf, kabid   ?tab=menunggu|kuota_penuh
POST  /rfq/:id/setujui                      staf, kabid   body: { hargaAcuan?, alasanHarga? }
POST  /rfq/:id/tolak                        staf, kabid   body: { catatan }
POST  /rfq/:id/terbitkan-po                 staf, kabid   -> rfqVerificationService.approveFinal
POST  /rfq/:id/alokasi/:allocId/batalkan    staf, kabid   body: { alasan }
GET   /reference-prices                     mitra, staf, kabid
GET   /reference-prices/:slug               mitra, staf, kabid
PUT   /reference-prices/:slug               staf, kabid   body: { harga, alasan }
POST  /reference-prices                     staf, kabid
```

---

## 7. PBI-09 — Mesin Agregasi Kuota (FR-07 bagian A)

**PIC:** Fariz | **SP:** 5 | **Aktor:** `umkm` terkurasi (melalui PBI-10), `staf` (pembatalan)

Ini inti logika Sprint 2. Fariz mengerjakan **service dan endpoint**; Naila (PBI-10) mengerjakan tampilan yang memanggil service ini.

### 7.1 User Story

> **Sebagai** UMKM terkurasi, **saya ingin** mengambil sebagian dari pesanan besar sesuai kapasitas produksi saya,  
> **agar** saya ikut memenuhi pesanan yang terlalu besar untuk saya kerjakan sendiri.

### 7.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-09-01 | Hanya UMKM `aktif` yang punya produk `terkurasi` dengan `subKomoditasSlug` sama dengan RFQ yang boleh mengambil kuota | Selain itu 403 `TIDAK_BERHAK_AMBIL_KUOTA` dengan penjelasan |
| AC-09-02 | Hanya RFQ berstatus `terbuka` yang bisa diambil kuotanya | Status lain 409 |
| AC-09-03 | Jumlah kuota harus bilangan bulat positif | Validasi input |
| AC-09-04 | Jumlah **tidak boleh melebihi sisa kuota RFQ** (`kuotaTotal - kuotaTerkumpul`) | Ditolak: "Melebihi sisa kuota terbuka (N satuan)" |
| AC-09-05 | Jumlah **tidak boleh melebihi kapasitas bulanan yang tersisa** pada produk pilihan (kapasitas bulanan dikurangi alokasi aktif bulan yang sama) | Ditolak dengan angka kapasitas tersisa |
| AC-09-06 | Satu UMKM hanya boleh punya satu alokasi aktif per RFQ | Alokasi kedua 409 (ubah lewat batalkan lalu ambil ulang) |
| AC-09-07 | Pengambilan bersifat **atomik**: dua UMKM mengambil bersamaan tidak boleh membuat total melebihi `kuotaTotal` | Diuji dengan 5 request bersamaan |
| AC-09-08 | UMKM wajib mengisi tanggal perkiraan selesai produksi; tidak boleh lewat dari tenggat RFQ dan tidak boleh sebelum hari ini | Validasi tanggal |
| AC-09-09 | Alokasi baru berstatus `proses_verifikasi` dan langsung menambah `kuotaTerkumpul` | Progres RFQ bertambah |
| AC-09-10 | Saat `kuotaTerkumpul === kuotaTotal`, status RFQ otomatis menjadi `proses_verifikasi` pada operasi yang sama | Tidak ada celah waktu |
| AC-09-11 | UMKM dapat membatalkan alokasinya selama RFQ `terbuka`; kuota terkumpul berkurang secara atomik | RFQ berstatus `proses_verifikasi` tidak bisa dibatalkan oleh UMKM |
| AC-09-12 | `tanggalPerkiraanSelesai` RFQ diperbarui menjadi tanggal terlambat dari seluruh alokasi aktif | Nilai konsisten setelah ambil atau batal |
| AC-09-13 | Nilai alokasi dihitung `jumlah * hargaAcuan RFQ` (snapshot) dan disimpan di alokasi | Total nilai semua alokasi = `kuotaTotal * hargaAcuan` saat penuh |
| AC-09-14 | Jika penyimpanan alokasi gagal setelah kuota ditambah, kuota dikembalikan (kompensasi) | Tidak ada kuota "hantu" |

### 7.3 Logika Inti

**Langkah `takeQuota` (urutan wajib):**

1. Muat RFQ dan validasi status `terbuka` serta tenggat belum lewat.
2. Validasi hak UMKM: akun `aktif` dan produk `terkurasi` dengan slug cocok milik `businessId` yang sama dengan `productId`.
3. Hitung kapasitas tersisa bulan itu (`getCapacityInfo`) dan tolak jika `jumlah` lebih besar.
4. **Penambahan atomik pada dokumen RFQ** (kunci konsistensi, memenuhi NFR-05 tanpa transaksi):

```js
const rfq = await RFQ.findOneAndUpdate(
  {
    _id: rfqId,
    status: 'terbuka',
    tenggat: { $gt: new Date() },
    $expr: { $lte: [{ $add: ['$kuotaTerkumpul', jumlah] }, '$kuotaTotal'] },   // tidak boleh lewat total
  },
  [
    { $set: {
        kuotaTerkumpul: { $add: ['$kuotaTerkumpul', jumlah] },
        status: {
          $cond: [{ $eq: [{ $add: ['$kuotaTerkumpul', jumlah] }, '$kuotaTotal'] },
                  'proses_verifikasi', '$status'],
        },
    } },
  ],
  { new: true }
);
if (!rfq) throw new AppError('Melebihi sisa kuota terbuka atau RFQ sudah tidak terbuka', 409);
```

5. Buat `RFQAllocation`. Indeks unik `{ rfqId, businessId, aktif }` mencegah alokasi ganda. Jika pembuatan gagal (termasuk karena duplikat), **kompensasi**:

```js
await RFQ.updateOne({ _id: rfqId }, [
  { $set: { kuotaTerkumpul: { $subtract: ['$kuotaTerkumpul', jumlah] },
            status: { $cond: [{ $eq: ['$status', 'proses_verifikasi'] }, 'terbuka', '$status'] } } },
]);
```

6. Perbarui `tanggalPerkiraanSelesai` RFQ, tulis `riwayat` dan audit log.

**Batalkan alokasi (`cancelAllocation`):** hanya jika alokasi `proses_verifikasi` dan RFQ `terbuka` (oleh UMKM) atau RFQ `terbuka`/`proses_verifikasi` (oleh staf). Update atomik mengurangi `kuotaTerkumpul` dan mengembalikan status RFQ ke `terbuka`; alokasi menjadi `dibatalkan` dengan alasan.

**Kapasitas bulanan tersisa:**

```js
// terpakai = jumlah semua alokasi aktif milik productId dengan tanggalPerkiraanSelesai di bulan yang sama
const terpakai = await RFQAllocation.aggregate([
  { $match: { productId, status: { $in: ['proses_verifikasi','terkonfirmasi'] },
              tanggalPerkiraanSelesai: { $gte: awalBulan, $lt: awalBulanDepan } } },
  { $group: { _id: null, total: { $sum: '$jumlah' } } },
]);
tersisaBulanIni = Math.max(0, product.kapasitasBulanan - (terpakai[0]?.total ?? 0));
```

Bulan dihitung dari `tanggalPerkiraanSelesai` yang diinput UMKM (zona waktu Asia/Jakarta).

**Contoh uji (wajib ditulis sebagai tes otomatis):**

| Kondisi awal | Aksi | Hasil |
|--------------|------|-------|
| RFQ 100, terkumpul 70; UMKM-A kapasitas 40 | A ambil 30 | Berhasil; terkumpul 100; RFQ `proses_verifikasi` |
| RFQ 100, terkumpul 70 | UMKM ambil 35 | Ditolak "Melebihi sisa kuota terbuka (30 lembar)" |
| Produk kapasitas 40, sudah ada alokasi 25 di bulan yang sama | ambil 20 | Ditolak, tersisa 15 |
| RFQ 100, terkumpul 90; dua UMKM serentak ambil 10 dan 10 | keduanya mengirim bersamaan | Satu berhasil, satu ditolak; terkumpul tepat 100 |
| UMKM sudah punya alokasi aktif pada RFQ | ambil lagi | 409 |
| UMKM dengan akun `menunggu_persetujuan` | ambil | 403 `AKUN_BELUM_AKTIF` |

### 7.4 Skema Database

```js
// models/RFQAllocation.js
{
  rfqId: ObjectId (ref RFQ, required, index),
  businessId: ObjectId (ref BusinessProfile, required),
  userId: ObjectId (ref User, required),
  productId: ObjectId (ref Product, required),
  jumlah: { type: Number, required: true, min: 1 },
  tanggalPerkiraanSelesai: { type: Date, required: true },
  nilai: { type: Number, required: true },                  // jumlah * hargaAcuan RFQ
  status: { type: String, enum: ['proses_verifikasi','terkonfirmasi','dibatalkan'],
            default: 'proses_verifikasi', index: true },
  alasanBatal: String, dibatalkanOleh: ObjectId, dibatalkanAt: Date,
  timestamps: true
}
// index unik parsial: { rfqId: 1, businessId: 1 } where status in ['proses_verifikasi','terkonfirmasi']
```

### 7.5 Endpoint

```
POST   /rfq/:id/kuota                 umkm (requireActiveUmkm)   body: { productId, jumlah, tanggalPerkiraanSelesai }
DELETE /rfq/:id/kuota                 umkm (pemilik alokasi)     -> batalkan alokasi milik sendiri
GET    /rfq/:id/kuota/info            umkm                       ?productId= -> getCapacityInfo
GET    /rfq/:id/alokasi               umkm(terkurasi), mitra(pemilik), staf, kabid -> daftar alokasi
```

### 7.6 Validasi

```js
productId: ObjectId milik businessId pengguna, statusKurasi 'terkurasi', slug sama RFQ
jumlah: z.number().int().min(1)
tanggalPerkiraanSelesai: tanggal >= hari ini dan <= tenggat RFQ
```

---

## 8. PBI-10 — Daftar RFQ Terbuka, Detail, dan Layar Ambil Kuota (FR-07 bagian B)

**PIC:** Naila | **SP:** 3 | **Aktor:** `umkm`, `mitra` (lihat progres), `staf`, `kabid`

### 8.1 User Story

> **Sebagai** UMKM terkurasi, **saya ingin** melihat permintaan pesanan besar yang cocok dengan produk saya, sisa kuotanya, dan mengambil bagian saya,  
> **agar** saya mendapat pesanan yang tidak bisa saya penuhi sendirian.

### 8.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-10-01 | Halaman "RFQ Terbuka" menampilkan kartu RFQ `terbuka` yang cocok dengan produk terkurasi UMKM: mitra, komoditas, target, progres, tenggat, tombol "Lihat dan Ambil Kuota" | UMKM tidak melihat RFQ komoditas lain |
| AC-10-02 | UMKM tanpa produk terkurasi melihat penjelasan "Produk Anda belum terkurasi" dan tautan ke Produk Saya | Tidak ada daftar kosong tanpa alasan |
| AC-10-03 | Detail RFQ menampilkan kartu ringkasan navy: Target, Terkumpul, Sisa (misal 100 − 70 = 30 lembar), progress bar hijau dengan label persentase | Angka sesuai data |
| AC-10-04 | Detail menampilkan tabel alokasi (nama UMKM, kecamatan, kapasitas, jumlah, persentase, nilai) | Alokasi `dibatalkan` tidak tampil |
| AC-10-05 | Panel "Ambil Kuota Pasokan": pilih produk, kapasitas bulanan produk, kapasitas tersisa, input jumlah, tanggal perkiraan selesai | Info kapasitas dari `getCapacityInfo` |
| AC-10-06 | Validasi langsung di sisi klien dan server: jika jumlah melebihi sisa kuota atau kapasitas tersisa, pesan merah muncul di bawah input dan tombol nonaktif | Contoh pesan: "Melebihi sisa kuota terbuka (30 lembar)" |
| AC-10-07 | Tombol "Kunci Komitmen Kuota" memanggil `POST /rfq/:id/kuota` dan menampilkan hasil | Setelah sukses, halaman diperbarui |
| AC-10-08 | Setelah UMKM mengunci, panel berubah menjadi "Komitmen Anda: N satuan, status Proses Verifikasi" dengan tombol "Batalkan Komitmen" selama RFQ `terbuka` | Tombol hilang saat RFQ `proses_verifikasi` |
| AC-10-09 | Jika terjadi konflik (kuota baru saja diambil UMKM lain), tampilkan pesan dan segarkan angka sisa kuota | Tidak ada layar macet |
| AC-10-10 | Mitra pemilik RFQ melihat halaman detail yang sama (tanpa panel ambil kuota) dengan status dan daftar alokasi | Hanya milik mitra |
| AC-10-11 | RFQ `proses_verifikasi` menampilkan banner "Kuota terpenuhi, menunggu verifikasi dinas"; RFQ `terpenuhi` menampilkan tombol ke PO | Banner sesuai status |
| AC-10-12 | Progres di-refresh otomatis setiap 30 detik pada halaman detail (polling sederhana) | Angka bertambah tanpa reload |

### 8.3 Logika

- RFQ yang cocok untuk UMKM: `GET /rfq/terbuka` menyaring `RFQ.status = 'terbuka'` dan `komoditasSlug` dalam daftar `subKomoditasSlug` produk terkurasi milik `businessId` pengguna.
- Validasi klien memakai nilai `sisaKuotaRfq` dan `tersisaBulanIni` dari `getCapacityInfo`, tetapi **server tetap sumber kebenaran** (nilai bisa berubah di antara dua klik).
- Persentase alokasi = `jumlah / kuotaTotal * 100`, dibulatkan satu desimal.

### 8.4 Endpoint (pelengkap)

```
GET /rfq/terbuka        umkm   -> RFQ terbuka yang cocok untuk UMKM
GET /rfq/:id            semua role yang berhak (lihat 5.5), respons berbeda per role
```

Tidak ada skema baru; memakai `RFQ` dan `RFQAllocation`.

### 8.5 Tampilan UI

```
RFQ-2026-010  Kain Tenun Suat Songket                         [Terbuka]
+------------------------------------------------+  +----------------------------+
| 100 Lembar   -   70 Lembar   =   30 Lembar     |  | Ambil Kuota Pasokan        |
| Target           Terkumpul        Sisa         |  | Produk [v Tenun Suat ... ] |
| [########################--------]  70%        |  | Kapasitas bulanan: 40      |
| Alokasi UMKM (tabel)                           |  | Tersisa bulan ini: 40      |
| Ambu Kanekes  40 lembar  40%  Rp14.000.000     |  | Jumlah [ 35 ]              |
| Sanggar Baduy 30 lembar  30%  Rp10.500.000     |  |  Melebihi sisa kuota (30)  |
+------------------------------------------------+  | [Kunci Komitmen Kuota]     |
                                                    +----------------------------+
```

---

## 9. PBI-11 — PO Summary PDF (FR-08)

**PIC:** Abdullah | **SP:** 3 | **Aktor:** `mitra`, `staf`, `kabid`, `umkm` (peserta alokasi, lihat saja)

### 9.1 User Story

> **Sebagai** mitra pembeli, **saya ingin** mengunduh ringkasan pesanan resmi berkop dinas setelah kuota terpenuhi,  
> **agar** saya punya dokumen kesepakatan pasokan yang jelas.

### 9.2 Acceptance Criteria

| No | Kriteria | Kondisi Terpenuhi |
|----|----------|------------------|
| AC-11-01 | PO hanya dapat dibuat untuk RFQ `terpenuhi` | Selain itu 409 |
| AC-11-02 | PO dibuat **sekali** per RFQ; pemanggilan berikutnya mengembalikan PO yang sama (idempoten) | Satu dokumen per RFQ |
| AC-11-03 | Nomor dokumen `PO-RFQ/{tahun}/{romawiBulan}/{seq3}` | Contoh `PO-RFQ/2026/XI/012` |
| AC-11-04 | Isi PDF: kop Dinas Koperasi dan UKM Kabupaten Lebak dan alamat, garis ganda, judul "PURCHASE ORDER SUMMARY (SURAT KESEPAKATAN PASOKAN BERSAMA)", nomor dokumen, data pemesan, komoditas, volume, harga acuan | Semua elemen tampil |
| AC-11-05 | Tabel rincian alokasi: nomor, nama UMKM, kecamatan, jumlah, nilai; baris total nilai transaksi | Total sama dengan `kuotaTotal * hargaAcuan` |
| AC-11-06 | Tiga blok tanda tangan: Perwakilan UMKM, Verifikator Bidang UMKM Dinas, Manajer Pengadaan Mitra, masing-masing dengan nama dan tanggal | Nama dari data sistem |
| AC-11-07 | Isi PO adalah **snapshot** saat diterbitkan; perubahan data UMKM sesudahnya tidak mengubah PO | Data disalin ke `PurchaseOrder.snapshot` |
| AC-11-08 | Halaman pratinjau PO menampilkan lembar seperti kertas A4 dengan tombol "Unduh Dokumen (.PDF)" dan "Cetak Lembar PO" | Tombol berfungsi |
| AC-11-09 | PO dapat diunduh oleh mitra pemilik RFQ, `staf`, `kabid`, dan UMKM yang punya alokasi `terkonfirmasi` di RFQ itu; lainnya 403 | Diuji lewat tes role |
| AC-11-10 | Format angka dan tanggal Indonesia: `Rp 35.000.000`, `19 November 2026` | Sesuai |
| AC-11-11 | PDF tidak memuat data pribadi UMKM selain nama usaha dan kecamatan | Tidak ada NIK, NIB, nomor HP |

### 9.3 Logika

- Pustaka: `pdfkit` (ringan, tanpa browser headless, sesuai batasan biaya). Font Latin standar bawaan.
- `poService.generate`: cek PO sudah ada (`PurchaseOrder.findOne({ rfqId })`); jika ada kembalikan. Jika belum, bangun `snapshot` dari RFQ dan alokasi `terkonfirmasi`, buat nomor, simpan, dan tulis PDF ke `uploads/private/po/{rfqId}.pdf`.
- Keunikan dijamin indeks unik `{ rfqId: 1 }`; jika dua proses menerbitkan bersamaan, yang kedua menangkap error duplikat lalu membaca PO yang ada.
- Blok tanda tangan adalah tempat nama tercetak (bukan tanda tangan kriptografis).

**Contoh isi tabel (data uji):**

| No | UMKM | Kecamatan | Jumlah | Nilai |
|----|------|-----------|-------:|------:|
| 1 | UMKM Tenun Ambu Kanekes | Leuwidamar | 40 lembar | Rp 14.000.000 |
| 2 | Sanggar Tenun Baduy Luar | Leuwidamar | 30 lembar | Rp 10.500.000 |
| 3 | Tenun Pusaka Ciboleger | Leuwidamar | 30 lembar | Rp 10.500.000 |
| | **Total** | | **100 lembar** | **Rp 35.000.000** |

### 9.4 Skema Database

```js
// models/PurchaseOrder.js
{
  rfqId: { type: ObjectId, ref: 'RFQ', required: true, unique: true },
  nomor: { type: String, required: true, unique: true },
  snapshot: {
    rfqKode: String, mitraNama: String, mitraId: String,
    komoditasNama: String, satuan: String, kuotaTotal: Number, hargaAcuan: Number,
    lokasiKirim: String, catatanMutu: String,
    alokasi: [{ namaUsaha: String, kecamatan: String, jumlah: Number, nilai: Number,
                tanggalPerkiraanSelesai: Date }],
    totalNilai: Number,
    verifikatorNama: String
  },
  pdfPath: String,
  generatedBy: ObjectId (ref User), generatedAt: Date,
  timestamps: true
}
```

### 9.5 Endpoint

```
GET /po/by-rfq/:rfqId         mitra(pemilik), staf, kabid, umkm(peserta)  -> metadata PO
GET /po/:id/pdf               idem                                         -> stream PDF (inline atau attachment)
GET /po/:id                   idem                                         -> data pratinjau (snapshot)
```

PO dibuat oleh `rfqVerificationService.approveFinal`, bukan lewat endpoint publik.

---

## 10. Kebutuhan Non-Fungsional Sprint 2

| Aspek | Target |
|-------|--------|
| Konsistensi kuota (NFR-05) | Total alokasi aktif tidak pernah melebihi `kuotaTotal`, termasuk saat 5 request bersamaan |
| Waktu respons | Daftar RFQ dan detail 3 detik atau kurang |
| Hak akses | Pengambilan kuota hanya UMKM `aktif` dengan produk terkurasi yang cocok; PO hanya pihak terkait |
| Integritas data | Harga acuan dan isi PO berupa snapshot yang tidak berubah |
| Audit | Setiap perubahan status RFQ dan alokasi tercatat |
| UI | Tailwind, tanpa emoji, gaya sama dengan Sprint 1 |

---

## 11. Out of Scope Sprint 2

- Pembayaran, negosiasi harga, penawaran harga oleh UMKM
- Pengiriman, logistik, dan pelacakan barang (menu "Jadwal Pengiriman" pada desain dihapus)
- Notifikasi email atau push untuk RFQ baru
- Tanda tangan digital tersertifikasi
- Pembagian kuota otomatis proporsional (Sprint 2 memakai pengambilan sukarela oleh UMKM)
- Event, forum, Sintesa, dasbor, manajemen akun (Sprint 3)

---

## 12. Definition of Done (DoD)

- [ ] Semua Acceptance Criteria terpenuhi
- [ ] Kode di-merge ke `develop` lewat pull request yang direview
- [ ] `npm run seed` membuat seluruh seed Sprint 1 dan Sprint 2 dari database kosong
- [ ] Tes otomatis untuk `takeQuota` (tabel 7.3) lulus, termasuk tes konkurensi
- [ ] State machine RFQ: aksi di luar alur mengembalikan 409
- [ ] Hak akses diuji untuk semua role dan endpoint baru
- [ ] PO PDF terbuka di pembaca PDF standar dan total sesuai
- [ ] Tidak ada data sensitif yang bocor di respons API atau PDF
- [ ] UI konsisten dan tanpa emoji

---

## 13. Keputusan Terbuka

| ID | Pertanyaan | Nilai bawaan | Perlu dikonfirmasi ke |
|----|-----------|--------------|----------------------|
| K-10 | Siapa fasilitator dinas yang memverifikasi RFQ dan apa kriterianya? | `staf` atau `kabid`; kriteria: volume wajar, tenggat sesuai, spesifikasi jelas, komoditas ada UMKM terkurasi | Ibu Juli |
| K-11 | Apa yang terjadi jika kuota tidak penuh saat tenggat? | RFQ `kedaluwarsa`, alokasi dibatalkan | Ibu Juli |
| K-12 | Boleh pengisian kuota sebagian (misal 90%) lalu PO tetap terbit? | Tidak. PO hanya saat 100% | Ibu Juli |
| K-13 | Siapa menentukan harga acuan resmi? | `staf` mengelola tabel harga acuan; mitra tidak bisa mengubah | Ibu Juli |
| K-14 | Boleh UMKM mengubah jumlah kuota setelah dikunci? | Tidak. Batalkan dulu lalu ambil ulang (selama RFQ `terbuka`) | Tim |

---

## 14. Referensi

- PRD SIPK-Lebak Sprint 1 (kontrak bersama Seksi 4)
- Proposal Capstone, Tabel Product Backlog dan skenario use case RFQ (Bab IV)
- Desain UI SIPK-Lebak (screen Agregasi RFQ, Detail RFQ, Ringkasan PO)
