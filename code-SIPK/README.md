# SIPK-Lebak: Sistem Informasi Pemasaran Kolaboratif UMKM Kabupaten Lebak

> **Capstone Design & Project** — Program Studi S1 Sistem Informasi, Fakultas Rekayasa Industri, Universitas Telkom (2026)  
> Bekerja sama dengan **Dinas Koperasi dan Usaha Kecil Menengah (Diskop & UKM) Kabupaten Lebak**, Provinsi Banten.

---

## 📌 Ringkasan Proyek

**SIPK-Lebak** (*Sistem Informasi Pembinaan dan Kurasi UMKM Lebak*) adalah portal web terintegrasi yang dirancang untuk mengatasi kesenjangan pendataan, standarisasi kurasi legalitas, dan keterbatasan kapasitas pasokan produk unggulan daerah di Kabupaten Lebak (khususnya komoditas kriya tenun tradisional Baduy dan olahan pangan lokal). 

Portal ini menghubungkan tiga pemangku kepentingan utama: **Pelaku UMKM**, **Dinas Koperasi & UKM Lebak (Pembina & Kurator)**, serta **Mitra Pembeli (B2B / Ritel / Instansi)**. 

> [!IMPORTANT]
> **Portal ini BUKAN Marketplace:** Sistem tidak menyediakan keranjang belanja daring (*shopping cart*), gerbang pembayaran (*payment gateway*), maupun integrasi kurir logistik berbayar. Fokus utama sistem adalah **pendataan terpusat, digitalisasi kurasi mutu produk, direktori katalog publik, agregasi kuota pasokan pesanan massal (RFQ), layanan kemasan daerah (Sintesa), pusat agenda event, forum komunitas, serta dasbor pemantauan kinerja dinas.**

---

## 🎯 Latar Belakang & Akar Permasalahan

Berdasarkan hasil observasi dan wawancara bersama pimpinan Bidang UMKM Dinas Koperasi dan UKM Kabupaten Lebak:
1. **Rendahnya Adopsi Digital UMKM**: Dari 72.835 unit usaha mikro dan kecil di Lebak, kurang dari 10% yang memanfaatkan platform digital; transaksi masih didominasi jalur konvensional dan ketergantungan pada tengkulak.
2. **Ketiadaan Basis Data Mandiri Daerah**: Pendataan daerah masih mengandalkan data agregat nasional PL-KUMKM pusat (141.436 usaha), belum memiliki basis data terstruktur khusus produk unggulan (kriya & pangan) per kecamatan (28 kecamatan).
3. **Layanan Klinik Kemasan Sintesa Masih Luring**: Pelaku UMKM harus datang langsung ke kantor dinas di Rangkasbitung untuk mengajukan fasilitasi desain dan subsidi kemasan tanpa antrean daring yang terukur.
4. **Alur Kurasi Izin Edar Masih Manual**: Pemeriksaan kelengkapan izin edar (NIB, P-IRT, Halal BPJPH, uji umur simpan) untuk kurasi ritel modern (Alfamart) dan Plaza Lebak masih dilakukan manual berbasis dokumen fisik.
5. **Kegagalan Pemenuhan Pesanan Kapasitas Besar (B2B)**: Pesanan massal dari hotel, instansi, atau BUMN sering gagal dipenuhi karena kapasitas produksi perajin perorangan terbatas dan belum adanya mekanisme kolaboratif untuk berbagi kuota pasokan (*supply aggregation*).
6. **Kanal Informasi Terfragmentasi**: Informasi pameran daerah (Harkop & Hari UMKM) hanya diumumkan lewat media sosial tanpa pendataan peserta daring, serta minimnya forum bertukar informasi legalitas usaha.

---

## 👥 Aktor Pengguna (*Role-Based Access Control*)

Mengacu pada prinsip penyederhanaan tata kelola dan efisiensi pengujian, sistem mengunci wewenang pada **4 Aktor Utama**:

| No | Peran / Aktor | Kode Role | Deskripsi Wewenang & Tanggung Jawab |
|:---:|:---|:---:|:---|
| 1 | **Pelaku UMKM** | `umkm` | Mendaftar akun mandiri (NIB/Email), melengkapi profil sentra (28 kecamatan), mengunggah dokumen legalitas & foto produk, mengajukan kurasi, mengambil kuota pasokan RFQ, mendaftar kemasan Sintesa, dan mendaftar stan event. |
| 2 | **Staf Dinas** | `staf` | Memeriksa berkas legalitas UMKM (NIB, P-IRT, Halal), mengisi catatan teknis evaluasi kurasi, memverifikasi draft RFQ mitra, mengelola jadwal konsultasi kemasan Sintesa, memoderasi forum, dan memverifikasi peserta event. |
| 3 | **Mitra Pembeli** | `mitra` | Menerbitkan permintaan pesanan massal (*Request for Quotation* / RFQ) dengan harga acuan dinas, memantau progres pemenuhan kuota UMKM, serta mengunduh dokumen *Purchase Order Summary* (PO PDF). Akun dibuat melalui dinas. |
| 4 | **Kepala Dinas / Kabid** | `kabid` | Memberikan persetujuan akhir kurasi (*approval* & penerbitan lencana terkurasi), memantau dasbor analitik pembinaan 28 kecamatan, mengelola akun pengguna, dan mengawasi log audit sistem. |

*Catatan: Publik/Pengunjung tanpa login dapat melihat Katalog Publik Produk Terkurasi dan Kalender Event Pameran Daerah.*

---

## 🚀 Roadmap Pengembangan & Dokumen PRD per Sprint

Pengembangan sistem dibagi ke dalam **3 Sprint SCRUM** yang terstruktur, di mana setiap sprint menghasilkan *working increment* yang dapat diuji (UAT):

### 📄 [Sprint 1: Fondasi, Data UMKM, Produk, dan Kurasi](PRD_SIPK_Lebak_Sprint1.md)
* **Fokus Utama:** Autentikasi JWT, Registrasi Mandiri UMKM Wizard 3 Langkah, Manajemen Dokumen Legalitas (NIB, SPP-PIRT, Halal), Manajemen Produk, Alur Verifikasi Kurasi Dinas 4 Tahap, dan Katalog Produk Publik.
* **Target Beban:** 24 Story Points (6 PBI).
* **Dokumen Lengkap:** [Lihat PRD_SIPK_Lebak_Sprint1.md](PRD_SIPK_Lebak_Sprint1.md)

### 📄 [Sprint 2: Portal Mitra, RFQ, Agregasi Kuota, dan PO Summary PDF](PRD_SIPK_Lebak_Sprint2.md)
* **Fokus Utama:** Form Pembuatan RFQ oleh Mitra Pembeli, Verifikasi RFQ & Penetapan Harga Acuan oleh Staf Dinas, Mesin Agregasi Kuota Pasokan Kolektif UMKM, Kunci Kuota 100%, dan Generator Dokumen PO Summary PDF berkop resmi Pemkab.
* **Target Beban:** 16 Story Points (5 PBI).
* **Dokumen Lengkap:** [Lihat PRD_SIPK_Lebak_Sprint2.md](PRD_SIPK_Lebak_Sprint2.md)

### 📄 [Sprint 3: Layanan Sintesa, Event Daerah, Forum Komunitas, dan Dasbor Analitik](PRD_SIPK_Lebak_Sprint3.md)
* **Fokus Utama:** Pendaftaran & Tracking Fasilitasi Kemasan Sintesa, Kalender Event Pameran & Registrasi Stan Daring, Forum Komunitas Diskusi UMKM, Dasbor Analitik Pembinaan 28 Kecamatan, serta Manajemen Pengguna & Log Audit.
* **Target Beban:** 20 Story Points (5 PBI).
* **Dokumen Lengkap:** [Lihat PRD_SIPK_Lebak_Sprint3.md](PRD_SIPK_Lebak_Sprint3.md)

---

## 👨‍💻 Pembagian Tugas Tim Pengembang (3 Anggota)

Untuk menjamin kodingan dapat berjalan paralel tanpa terjadi konflik (*merge conflict*) di repositori Git, setiap anggota tim memegang kepemilikan modul secara vertikal (Frontend UI, Controller Backend, dan Model):

| Sprint | Naila Hafidz Bachtiar | Muhammad Fariz Eka Putra | Abdullah Muchtar Rasyid |
| :---: | :--- | :--- | :--- |
| **Sprint 1** | **Auth & Profil UMKM (8 SP)**<br>• Registrasi wizard 3 langkah<br>• Login & sesi JWT<br>• Kelola profil usaha & direktori 28 kecamatan | **Produk & Katalog Publik (8 SP)**<br>• Form kelola & unggah produk<br>• Kompresi foto produk otomatis<br>• Halaman katalog publik & filter pencarian | **Kurasi & Dokumen Legalitas (8 SP)**<br>• Modul unggah berkas legalitas<br>• Antrean kurasi dinas 4 tahap<br>• Rekomendasi verifikator & approval Kabid |
| **Sprint 2** | **Portal Mitra & RFQ (6 SP)**<br>• Form pengajuan RFQ oleh mitra<br>• Dashboard pemantauan RFQ mitra<br>• Halaman katalog RFQ terbuka untuk UMKM | **Mesin Agregasi Kuota (5 SP)**<br>• Service kalkulasi alokasi kuota<br>• Validasi kapasitas bulanan UMKM<br>• Indikator progress bar kuota pasokan | **Verifikasi RFQ & PO PDF (5 SP)**<br>• Verifikasi teknis RFQ oleh dinas<br>• Penetapan harga acuan resmi dinas<br>• Generator berkas PO Summary PDF resmi |
| **Sprint 3** | **Dasbor Analitik & Sintesa (8 SP)**<br>• Dasbor eksekutif analitik dinas (28 kec)<br>• Ekspor rekap data UMKM ke Excel<br>• Form pendaftaran kemasan Sintesa | **Event Daerah & Forum (8 SP)**<br>• Kalender event pameran daerah<br>• Formulir pendaftaran stan pameran<br>• Forum komunitas UMKM & balasan resmi dinas | **Tata Kelola Akun & Layanan (7 SP)**<br>• Pengelolaan jadwal klinik Sintesa<br>• Modul manajemen akun pengguna (RBAC)<br>• Pemantauan log audit aktivitas sistem |

---

## 🛡️ Batasan Pengembangan & Lingkungan Pengujian (PoC / Staging)

Sesuai dengan batasan standar penelitian *Capstone Design & Project* Program Studi S1 Sistem Informasi Telkom University (mengacu pada batasan di Bab III):
1. **Status Produk**: Sistem dikembangkan sebagai **Proof-of-Concept (PoC) / Minimum Viable Product (MVP)** untuk membuktikan kelayakan solusi atas permasalahan mitra.
2. **Lingkungan Pengujian**: Sistem dijalankan dan diuji pada lingkungan **Local Server (`localhost`)** dan server **Staging cloud gratis/terjangkau** (Vercel / Render / Supabase). Tidak mencakup hosting produksi komersial atau integrasi ke server domain resmi `.go.id` Pemkab Lebak.
3. **Data & Verifikasi**: Pengujian menggunakan data simulasi (*dummy data*) yang diselaraskan dengan sampel riil UMKM Lebak. Verifikasi berkas NIB dan sertifikat Halal/P-IRT dilakukan secara manual oleh staf dinas melalui dokumen PDF/gambar yang diunggah (tanpa integrasi langsung ke API pusat OSS-RBA).
4. **Metodologi Pengujian**: Pengujian sistem mencakup *Black-Box Testing* untuk validasi logika fungsional dan *User Acceptance Testing* (UAT) menggunakan kuesioner *System Usability Scale* (SUS) bersama perwakilan dinas dan UMKM dengan target skor $\ge 70$ (*Acceptable*).

---

## 🛠️ Arsitektur & Teknologi

- **Frontend**: React 18 + Vite, Tailwind CSS, Lucide React Icons, Axios, React Router DOM v6.
- **Backend**: Node.js v20 (LTS) + Express.js v4.
- **Basis Data**: MongoDB + Mongoose v8.
- **Autentikasi**: JSON Web Token (JWT) berbasis HttpOnly Cookie + bcrypt hashing.
- **Dokumen & Media**: Multer (file upload), Sharp (auto image compression $< 300\text{ KB}$), PDFKit / Puppeteer (PO PDF generator), ExcelJS (rekap analitik dinas).

---

## 📂 Struktur Repositori

```text
code-SIPK/
├── PRD_SIPK_Lebak_Sprint1.md          # Dokumen Kebutuhan Produk Sprint 1 (Fondasi, UMKM, Kurasi)
├── PRD_SIPK_Lebak_Sprint2.md          # Dokumen Kebutuhan Produk Sprint 2 (RFQ, Kuota, PO PDF)
├── PRD_SIPK_Lebak_Sprint3.md          # Dokumen Kebutuhan Produk Sprint 3 (Sintesa, Event, Forum, Dasbor)
├── README.md                          # Dokumentasi utama proyek & panduan tim
│
├── backend/                           # Service RESTful API (Node.js + Express)
│   ├── src/
│   │   ├── config/                    # Konfigurasi database & environment
│   │   ├── constants/                 # Konstanta roles, kecamatan, status enum
│   │   ├── middleware/                # Auth, RBAC authorize, file upload
│   │   ├── models/                    # Skema Mongoose (User, Business, Product, RFQ, dll)
│   │   └── modules/                   # Controller & Service terpisah per modul fitur
│   └── package.json
│
└── frontend/                          # Client Web Application (React + Vite + Tailwind)
    ├── src/
    │   ├── components/                # Komponen UI modular (Navbar, Sidebar, Modal, Card)
    │   ├── layouts/                   # Layout halaman per peran pengguna
    │   ├── pages/                     # Halaman fitur (auth, umkm, dinas, mitra, publik)
    │   └── services/                  # Integrasi API Axios
    └── package.json
```

---

## 🎓 Tim Pengembang & Informasi Akademik

* **Program Studi**: S1 Sistem Informasi
* **Fakultas**: Fakultas Rekayasa Industri, Universitas Telkom
* **Anggota Tim**:
  1. **Naila Hafidz Bachtiar** (NIM: 1202220010)
  2. **Muhammad Fariz Eka Putra** (NIM: 1202223099)
  3. **Abdullah Muchtar Rasyid** (NIM: 1202224111)
* **Instansi Mitra Studi Kasus**: Dinas Koperasi dan Usaha Kecil Menengah Kabupaten Lebak, Jl. Abdi Negara No. 3, Rangkasbitung Barat, Kec. Rangkasbitung, Kabupaten Lebak, Banten 42312.
