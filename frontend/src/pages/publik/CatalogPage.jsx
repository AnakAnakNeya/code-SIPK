// ============================================================================
// [PBI-05] Halaman Katalog Komoditas Terkurasi Lebak (frontend/src/pages/publik/CatalogPage.jsx)
// Tampilan disesuaikan dengan desain stitch: sipk_lebak_katalog_produk_umkm
// ============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  Award,
  Building2,
  Phone,
  ShieldCheck,
  MapPin,
  ExternalLink,
  Package,
  Download,
  ChevronDown,
  RotateCcw,
  X,
  SlidersHorizontal,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { AppLayout } from '../../layouts/AppLayout.jsx';
import { PublicNavbar } from '../../layouts/PublicNavbar.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Modal } from '../../components/Modal.jsx';
import { CustomSelect } from '../../components/ui/CustomSelect.jsx';
import { KECAMATAN } from '../../constants/kecamatan.js';

const KATEGORI_OPTIONS = [
  { value: '', label: 'Semua Kategori Komoditas' },
  { value: 'olahan_pangan', label: 'Olahan Pangan & Minuman' },
  { value: 'kriya_tenun', label: 'Kriya Tradisional & Tenun' },
];

const KECAMATAN_OPTIONS = [
  { value: '', label: 'Semua Kecamatan (28 Wilayah)' },
  ...KECAMATAN.map((kec) => ({ value: kec, label: `Kecamatan ${kec}` })),
];

const SORT_OPTIONS = [
  { value: 'terbaru', label: 'Terbaru Ditambahkan' },
  { value: 'harga_asc', label: 'Harga: Rendah ke Tinggi' },
  { value: 'harga_desc', label: 'Harga: Tinggi ke Rendah' },
];

const DUMMY_PRODUCTS = [
  {
    id: 'prod-001',
    nama: 'Tenun Ikat Baduy Motif Suat Songket',
    kategori: 'kriya_tenun',
    kategoriLabel: 'Kriya Tradisional & Tenun',
    subKomoditas: 'Tenun Suat Songket',
    namaUsaha: 'Sanggar Tenun Ambu Kanekes',
    kecamatan: 'Leuwidamar',
    hargaAcuan: 350000,
    satuan: 'lembar',
    kapasitasBulanan: 45,
    gradeKurasi: 'A',
    terkurasiAt: '2026-11-10',
    nomorSK: 'SK-KUR/001/XI/2026',
    deskripsi: 'Kain tenun asli buatan tangan perajin perempuan Kanekes Baduy Luar menggunakan alat tenun bukan mesin (ATBM) dengan pewarna alami.',
  },
  {
    id: 'prod-002',
    nama: 'Gula Aren Semut Organik 500g',
    kategori: 'olahan_pangan',
    kategoriLabel: 'Olahan Pangan & Minuman',
    subKomoditas: 'Gula Aren Semut',
    namaUsaha: 'KUB Aren Jaya Sobang',
    kecamatan: 'Sobang',
    hargaAcuan: 28000,
    satuan: 'pak',
    kapasitasBulanan: 600,
    gradeKurasi: 'A',
    terkurasiAt: '2026-11-05',
    nomorSK: 'SK-KUR/002/XI/2026',
    deskripsi: 'Gula aren bubuk organik dari nira aren pegunungan Sobang dengan kadar air rendah dan kemasan kedap udara.',
  },
  {
    id: 'prod-003',
    nama: 'Kopi Robusta Hariang Roast 200g',
    kategori: 'olahan_pangan',
    kategoriLabel: 'Olahan Pangan & Minuman',
    subKomoditas: 'Kopi Robusta',
    namaUsaha: 'Poktan Barokah Kopi Lebak',
    kecamatan: 'Sobang',
    hargaAcuan: 42000,
    satuan: 'pouch',
    kapasitasBulanan: 250,
    gradeKurasi: 'A',
    terkurasiAt: '2026-11-02',
    nomorSK: 'SK-KUR/003/XI/2026',
    deskripsi: 'Kopi robusta petik merah pegunungan Lebak dengan aroma harum khas roasted biji pilihan.',
  },
  {
    id: 'prod-004',
    nama: 'Tas Koja Serat Teureup Alami',
    kategori: 'kriya_tenun',
    kategoriLabel: 'Kriya Tradisional & Tenun',
    subKomoditas: 'Tas Koja Baduy',
    namaUsaha: 'Kriya Etnik Kanekes',
    kecamatan: 'Leuwidamar',
    hargaAcuan: 85000,
    satuan: 'buah',
    kapasitasBulanan: 120,
    gradeKurasi: 'A',
    terkurasiAt: '2026-10-28',
    nomorSK: 'SK-KUR/004/X/2026',
    deskripsi: 'Tas selempang tradisional Baduy dari anyaman serat kulit kayu teureup yang kuat, tahan air, dan ramah lingkungan.',
  },
  {
    id: 'prod-005',
    nama: 'Sale Pisang Siuh Renyah 250g',
    kategori: 'olahan_pangan',
    kategoriLabel: 'Olahan Pangan & Minuman',
    subKomoditas: 'Sale Pisang',
    namaUsaha: 'UMKM Barokah Salepisan',
    kecamatan: 'Cibadak',
    hargaAcuan: 18500,
    satuan: 'pak',
    kapasitasBulanan: 400,
    gradeKurasi: 'B',
    terkurasiAt: '2026-10-25',
    nomorSK: 'SK-KUR/005/X/2026',
    deskripsi: 'Sale pisang khas Lebak dengan pengasapan tradisional dan lapisan tepung krispi manis alami.',
  },
  {
    id: 'prod-006',
    nama: 'Gula Aren Cetak Koin Tradisional',
    kategori: 'olahan_pangan',
    kategoriLabel: 'Olahan Pangan & Minuman',
    subKomoditas: 'Gula Aren Cetak',
    namaUsaha: 'KUB Aren Jaya Sobang',
    kecamatan: 'Sobang',
    hargaAcuan: 22000,
    satuan: 'ikat',
    kapasitasBulanan: 800,
    gradeKurasi: 'A',
    terkurasiAt: '2026-10-20',
    nomorSK: 'SK-KUR/006/X/2026',
    deskripsi: 'Gula aren padat murni dicetak batok kelapa tradisional tanpa campuran pemanis buatan.',
  },
];

export function CatalogPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [sortBy, setSortBy] = useState('terbaru');
  const [activeModalProduct, setActiveModalProduct] = useState(null);

  const hasActiveFilter = Boolean(searchTerm || selectedKecamatan || selectedKategori || sortBy !== 'terbaru');
  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedKecamatan('');
    setSelectedKategori('');
    setSortBy('terbaru');
  };

  const filteredProducts = DUMMY_PRODUCTS
    .filter((prod) => {
      const matchesSearch =
        !searchTerm ||
        prod.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.subKomoditas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.namaUsaha.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesKec = !selectedKecamatan || prod.kecamatan === selectedKecamatan;
      const matchesKat = !selectedKategori || prod.kategori === selectedKategori;
      return matchesSearch && matchesKec && matchesKat;
    })
    .sort((a, b) => {
      if (sortBy === 'harga_asc') return a.hargaAcuan - b.hargaAcuan;
      if (sortBy === 'harga_desc') return b.hargaAcuan - a.hargaAcuan;
      return 0; // terbaru
    });

  const content = (
    <div className="space-y-6">
      {/* Header Halaman */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
            Katalog Produk Unggulan Terkurasi
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Menampilkan produk komoditas UMKM Kabupaten Lebak yang telah memenuhi standar mutu dan kelengkapan izin dinas.
          </p>
        </div>

        <button
          onClick={() => alert('Mengunduh e-katalog terkurasi Lebak format PDF...')}
          className="flex items-center gap-2 px-4 py-2 bg-navy-900 hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg transition self-start shrink-0 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Unduh E-Katalog (.pdf)</span>
        </button>
      </div>

      {/* Filter Bar (Modern, Rapi & Responsif) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        {/* Baris 1: Pencarian Utama */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama produk, sub-komoditas, atau nama unit usaha UMKM..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-10 text-xs rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white transition focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900 placeholder:text-slate-400"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Baris 2: Dropdown Filter Bersebelahan Secara Proporsional */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-end">
          <CustomSelect
            label="Kategori Komoditas"
            value={selectedKategori}
            onChange={(val) => setSelectedKategori(val)}
            options={KATEGORI_OPTIONS}
            placeholder="Semua Kategori Komoditas"
          />

          <CustomSelect
            label="Kecamatan Sentra Usaha"
            value={selectedKecamatan}
            onChange={(val) => setSelectedKecamatan(val)}
            options={KECAMATAN_OPTIONS}
            placeholder="Semua Kecamatan (28 Wilayah)"
          />

          <CustomSelect
            label="Urutkan Harga"
            value={sortBy}
            onChange={(val) => setSortBy(val)}
            options={SORT_OPTIONS}
            placeholder="Terbaru Ditambahkan"
          />
        </div>

        {/* Baris 3: Active Filter Chips & Counter Hasil */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400 text-[11px] font-semibold">Filter aktif:</span>
            {!hasActiveFilter && (
              <span className="text-slate-400 italic text-[11px]">Semua komoditas ditampilkan</span>
            )}
            {selectedKategori && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-50 text-navy-900 font-semibold border border-navy-200/80">
                <span>{selectedKategori === 'olahan_pangan' ? 'Olahan Pangan' : 'Kriya & Tenun'}</span>
                <button
                  type="button"
                  onClick={() => setSelectedKategori('')}
                  className="hover:text-rose-600 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedKecamatan && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-50 text-navy-900 font-semibold border border-navy-200/80">
                <span>Kec. {selectedKecamatan}</span>
                <button
                  type="button"
                  onClick={() => setSelectedKecamatan('')}
                  className="hover:text-rose-600 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy-50 text-navy-900 font-semibold border border-navy-200/80">
                <span>"{searchTerm}"</span>
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="hover:text-rose-600 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="text-[11px] text-rose-600 hover:text-rose-800 font-semibold inline-flex items-center gap-1 ml-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          <span className="font-semibold text-slate-500 text-[11px]">
            Menampilkan <strong className="text-navy-900 font-extrabold">{filteredProducts.length}</strong> produk terkurasi
          </span>
        </div>
      </div>

      {/* Grid Kartu Produk (Sesuai Desain Stitch) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Slot Foto Komoditas */}
              <div className="relative h-48 bg-slate-100 flex flex-col items-center justify-center text-slate-400 border-b border-slate-100">
                <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  TERKURASI DINAS
                </span>
                <Package className="w-12 h-12 stroke-1 text-slate-300 mb-1" />
                <span className="text-xs font-medium text-slate-400">FOTO KOMODITAS</span>
              </div>

              {/* Rincian Produk */}
              <div className="p-5 space-y-2">
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                  {prod.kategoriLabel}
                </p>
                <h3 className="font-bold text-base text-navy-900 leading-snug">
                  {prod.nama}
                </h3>
                <p className="text-xs text-slate-600 font-medium">{prod.namaUsaha}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Kecamatan {prod.kecamatan}</span>
                </p>
              </div>
            </div>

            {/* Footer Kartu: Harga & Tombol Detail */}
            <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-400">Harga Acuan</p>
                <p className="text-sm font-extrabold text-navy-900">
                  Rp{prod.hargaAcuan.toLocaleString('id-ID')}{' '}
                  <span className="text-xs font-normal text-slate-500">/ {prod.satuan}</span>
                </p>
              </div>

              <button
                onClick={() => setActiveModalProduct(prod)}
                className="px-3.5 py-1.5 rounded-md border border-slate-200 hover:border-navy-900 text-navy-900 text-xs font-semibold transition"
              >
                Lihat Detail
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Detail Produk Terkurasi */}
      <Modal
        isOpen={!!activeModalProduct}
        onClose={() => setActiveModalProduct(null)}
        title={activeModalProduct?.nama || 'Detail Komoditas'}
        size="md"
      >
        {activeModalProduct && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-navy-900 text-sm">
                  {activeModalProduct.namaUsaha}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Grade {activeModalProduct.gradeKurasi}
                </span>
              </div>
              <p className="text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Kecamatan {activeModalProduct.kecamatan}, Kab. Lebak</span>
              </p>
              <p className="text-slate-600 leading-relaxed">{activeModalProduct.deskripsi}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-slate-700">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="text-[11px] text-slate-400">Harga Acuan Resmi</p>
                <p className="font-bold text-sm text-navy-900 mt-0.5">
                  Rp{activeModalProduct.hargaAcuan.toLocaleString('id-ID')} / {activeModalProduct.satuan}
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <p className="text-[11px] text-slate-400">Kapasitas Produksi</p>
                <p className="font-bold text-sm text-navy-900 mt-0.5">
                  {activeModalProduct.kapasitasBulanan} {activeModalProduct.satuan} / bln
                </p>
              </div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-lg">
              <p className="text-[11px] text-slate-400">Surat Keputusan (SK) Kurasi Mutu</p>
              <p className="font-mono font-bold text-navy-900 mt-0.5">{activeModalProduct.nomorSK}</p>
            </div>

            {/* Proteksi Kontak sesuai PRD AC-05-08 */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              {user ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-amber-900">Kontak WhatsApp Pelaku Usaha:</p>
                    <p className="text-amber-800 font-mono mt-0.5">+62 812-9844-1920 (Terverifikasi)</p>
                  </div>
                  <a
                    href="https://wa.me/6281298441920"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700"
                  >
                    Hubungi WA
                  </a>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-amber-900 text-[11px]">
                    Nomor kontak langsung pelaku usaha dilindungi. Silakan masuk untuk melihat kontak.
                  </p>
                  <Link
                    to="/login"
                    className="px-3 py-1.5 bg-navy-900 text-white rounded-lg font-bold text-xs whitespace-nowrap"
                  >
                    Masuk
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );

  // Jika sudah login, tampilkan dengan Sidebar & Navbar (AppLayout)
  // Jika belum login, tampilkan dengan PublicNavbar di kontainer penuh
  if (user) {
    return <AppLayout>{content}</AppLayout>;
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
      <PublicNavbar />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {content}
      </main>
    </div>
  );
}

export default CatalogPage;
