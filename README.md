# SIPK-Lebak: Sistem Informasi Pemasaran Kolaboratif UMKM Kabupaten Lebak

> **Capstone Design Project** — S1 Sistem Informasi, Telkom University  
> Bekerja sama dengan **Dinas Koperasi dan Usaha Kecil Menengah (Diskop & UKM) Kabupaten Lebak**, Provinsi Banten.

---

## 📌 Ringkasan Proyek

**SIPK-Lebak** (*Sistem Informasi Pembinaan dan Kurasi UMKM Lebak*) adalah rancangan sistem informasi terintegrasi berbasis web yang dirancang untuk mengatasi kesenjangan pemasaran, legalitas, dan kapasitas pasokan produk unggulan daerah di Kabupaten Lebak (khususnya komoditas kriya tenun tradisional Baduy dan olahan pangan lokal). 

Sistem ini menjembatani kolaborasi antara **Pelaku UMKM**, **Tim Verifikator Dinas Koperasi & UKM**, serta **Mitra Pembeli Korporasi/Ritel (B2B)** melalui standardisasi kurasi, fasilitasi kemasan, serta mekanisme penggabungan kuota pasokan (*supply aggregation*).

---

## 🎯 Latar Belakang & Akar Permasalahan

Berdasarkan hasil wawancara observasi bersama Kepala Bidang UMKM Dinas Koperasi dan UKM Kabupaten Lebak serta analisis operasional di lapangan:
1. **Kurang dari 10% UMKM Terdigitalisasi**: Dari 72.835 UMKM aktif di Lebak, sebagian besar masih bergantung pada tengkulak dan transaksi tatap muka.
2. **Pendataan Mandiri Belum Terpusat**: Basis data daerah masih mengacu pada data agregat PL-KUMKM pusat (141.436 unit), belum memisahkan basis data khusus UMKM berbasis produk (kriya & pangan).
3. **Layanan Kemasan Sintesa Masih Luring**: Pelaku usaha harus datang fisik ke Rangkasbitung untuk mengajukan fasilitasi desain kemasan gratis tanpa ada antrean daring.
4. **Verifikasi Kurasi Ritel & Plaza Lebak Belum Terdigitalisasi**: Pemeriksaan izin edar (NIB, Halal, P-IRT, Uji Umur Simpan) untuk mitra seperti Alfamart masih dilakukan manual di atas kertas.
5. **Keterbatasan Kapasitas Pesanan Skala Besar (B2B)**: Ketika instansi atau hotel memesan suvenir/produk dalam jumlah ratusan unit, perajin perorangan sering menolak karena kapasitas terbatas dan belum adanya mekanisme pembagian kuota bersama.

---

## 🚀 Fitur Utama & Modul Sistem

Sistem ini mencakup 6 modul layanan utama:

1. **Direktori Katalog & Profil Produk Unggulan**:
   - Menampilkan etalase resmi produk kriya dan pangan olahan per kecamatan di Kabupaten Lebak.
   - Penanda lencana resmi *"Terkurasi Dinas"* untuk produk yang telah memenuhi standar legalitas.
2. **Portal Verifikasi Kurasi Mutu Dinas**:
   - Alur verifikasi digital 4 tahap untuk kelengkapan izin legalitas (NIB OSS-RBA, SPP-PIRT, Sertifikat Halal BPJPH, uji laboratorium umur simpan).
   - Fitur penetapan lencana kurasi dan modul pengembalian catatan revisi ke akun UMKM.
3. **Layanan Desain Kemasan Gratis ("Sintesa")**:
   - Pendaftaran formulir daring, pemilihan jenis kemasan (standing pouch/box/label), dan penjadwalan temu konsultasi klinik kemasan secara transparan.
4. **Agregasi Pasokan Pesanan Besar (*Request for Quotation* / RFQ)**:
   - Kalkulator pemenuhan kuota bersama (*shared inventory aggregation*) bagi pesanan institusi/hotel.
   - Menggabungkan kapasitas antar-UMKM terkurasi secara proporsional hingga mencapai target 100%.
   - Otomasi penerbitan dokumen resmi *Purchase Order Summary* (PO PDF) ber-kop dinas.
5. **Pusat Informasi Event Pameran & Forum Komunitas**:
   - Kalender pameran resmi (Hari Koperasi / Harkop & Hari UMKM) dengan sistem registrasi kuota stan daring.
   - Ruang diskusi terstruktur bagi pelaku UMKM untuk berbagi rantai pasok bahan baku dan konsultasi perizinan.
6. **Dasbor Analitik Pembinaan Daerah & RBAC**:
   - Visualisasi pemetaan sebaran UMKM dan status legalitas per kecamatan di 28 kecamatan Kabupaten Lebak.
   - Manajemen hak akses berdasarkan 4 peran pengguna (*Role-Based Access Control*).

---

## 👥 Aktor Pengguna (*Role-Based Access Control*)

| No | Peran / Aktor | Deskripsi Wewenang |
| :---: | :--- | :--- |
| 1 | **Pelaku UMKM** | Mengelola profil usaha, mengunggah data produk, mendaftar kemasan Sintesa, mengambil porsi kuota RFQ, dan mendaftar stan pameran. |
| 2 | **Verifikator / Staf Dinas** | Memeriksa dokumen perizinan, menerbitkan lencana kurasi, mengelola antrean Sintesa, mempublikasikan event pameran, dan memantau dasbor analitik. |
| 3 | **Mitra Pembeli (B2B / Ritel)** | Menerbitkan permintaan pesanan skala besar (RFQ), memantau progres pemenuhan kuota, dan mengunduh ringkasan PO bersama. |
| 4 | **Administrator Sistem** | Mengelola akun pengguna, otorisasi peran (RBAC), serta pemeliharaan data master sistem. |

---

## 📂 Struktur Repositori

```text
├── Bab_I_Final.md / .docx             # Bab I: Pendahuluan & Latar Belakang Masalah
├── Bab_II_Final.md / .docx            # Bab II: Tinjauan Pustaka & Landasan Teori
├── Bab_III_Final.md / .docx           # Bab III: Metodologi Pengembangan (TOGAF & Scrum)
├── Bab_IV_Final.md / .docx            # Bab IV: Perancangan Arsitektur, Sistem & UI/UX
│
├── build_all_docx_clean.py            # Skrip kompilasi otomatis Markdown ke Word (.docx) berstandar skripsi
├── build_bab1_master.py s.d. bab4     # Skrip modular pembentuk dokumen per bab
│
├── generate_archimate_strict_v2.py    # Generator diagram arsitektur ArchiMate 3.2
├── generate_bpmn_pro.py               # Generator diagram alur proses bisnis BPMN 2.0 (As-Is & To-Be)
├── generate_uml_erd_pro.py            # Generator Use Case, Activity Diagram, dan ERD Crow's Foot
├── generate_fishbone.py               # Generator diagram analisis akar masalah Ishikawa (Fishbone)
│
├── gambar_bpmn_to_be_kurasi.png       # Diagram To-Be Kurasi Dinas & Layanan Sintesa
├── gambar_bpmn_to_be_agregasi.png     # Diagram To-Be Agregasi Kuota Pesanan Besar (RFQ)
├── gambar_erd_konseptual.png          # Relasi Basis Data Relasional SIPK-Lebak
├── gambar_ui_1_katalog_sintesa.png    # Mockup Layar 1: Katalog Publik & Pendaftaran Sintesa
├── gambar_ui_2_verifikasi_kurasi.png  # Mockup Layar 2: Verifikasi Kurasi Berkas Dinas
├── gambar_ui_3_agregasi_rfq.png       # Mockup Layar 3: Kalkulator Agregasi Kuota RFQ
├── gambar_ui_4_dasbor_event_forum.png # Mockup Layar 4: Dasbor Analitik, Event & Forum
│
└── README.md                          # Dokumentasi utama repositori
```

---

## 🎨 Perancangan Antarmuka & Prototipe UI/UX

Prototipe antarmuka dirancang dengan standar desain aplikasi pemerintahan modern (*clean, professional, and accessible*):
- **Design System**: Mengadopsi prinsip desain institusional (referensi: *GOV.UK Design System*, *Stripe Dashboard*).
- **Palet Warna**:
  - Primary / Header / Sidebar: Deep Navy (`#0F2A4F`)
  - Aksi Sekunder: Navy Blue (`#1E3A8A`)
  - Success / Terkurasi: Forest Green (`#16A34A` / latar `#DCFCE7`)
  - Warning / Menunggu: Amber (`#F59E0B` / latar `#FEF3C7`)
  - Danger / Revisi: Red (`#DC2626` / latar `#FEE2E2`)
  - Latar Halaman: Slate Light (`#F1F5F9`)
- **Tipografi**: Inter / Segoe UI / Plus Jakarta Sans.
- **Strict Guidelines**: Bebas dari emoji dekoratif, tanpa gradien mencolok, tata letak grid dan flexbox presisi, serta ikon outline terstandardisasi.

---

## ⚙️ Petunjuk Menjalankan Skrip

### 1. Prasyarat Lingkungan
Pastikan telah terpasang **Python 3.9+** pada sistem Anda:
```bash
pip install python-docx matplotlib pillow graphviz
```

### 2. Mengompilasi Dokumen Laporan (.docx)
Untuk membangun ulang seluruh dokumen laporan Bab I sampai Bab IV dengan format margin, font *Times New Roman*, tabel proporsional, dan penomoran otomatis yang rapi:
```bash
python build_all_docx_clean.py
```

### 3. Memperbarui Diagram Arsitektur & UML
Untuk meregenerasi diagram alur bisnis, arsitektur ArchiMate, dan ERD:
```bash
python generate_bpmn_pro.py
python generate_archimate_strict_v2.py
python generate_uml_erd_pro.py
```

---

## 🎓 Tim Penyusun & Informasi Akademik

- **Peneliti / Pengembang**: Naila Hafidz Bachtiar  
- **Program Studi**: S1 Sistem Informasi  
- **Fakultas**: Fakultas Rekayasa Industri, Telkom University  
- **Lokasi Studi Kasus**: Dinas Koperasi dan Usaha Kecil Menengah Kabupaten Lebak, Jl. Abdi Negara No. 3, Rangkasbitung, Banten.
