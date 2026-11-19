// ============================================================================
// [PBI-05] Halaman Publik: Katalog Komoditas Terkurasi Lebak (frontend/src/pages/publik/CatalogPage.jsx)
// PIC: Fariz
// Kriteria:
// - AC-05-01 & AC-05-02: Dapat dibuka tanpa login, hanya produk 'terkurasi' yang tampil
// - AC-05-03 s/d AC-05-05: Grid kartu responsif, pencarian teks, filter 28 kecamatan & kategori
// - AC-05-08 & AC-05-09: Lencana grade resmi, nomor WA hanya untuk pengguna yang login
// ============================================================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Filter,
  Award,
  Building2,
  Phone,
  ShieldCheck,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { KECAMATAN } from '../../constants/kecamatan.js';

// Dummy dataset awal sebelum dihubungkan dengan API katalog dinas (PRD 5.2)
const DUMMY_PRODUCTS = [
  {
    id: 'prod-001',
    nama: 'Tenun Ikat Baduy Motif Suat Songket',
    kategori: 'kriya_tenun',
    kategoriLabel: 'Kriya & Tenun',
    subKomoditas: 'Tenun Suat Songket',
    namaUsaha: 'UMKM Tenun Ambu Kanekes',
    kecamatan: 'Leuwidamar',
    hargaAcuan: 350000,
    satuan: 'lembar',
    kapasitasBulanan: 45,
    gradeKurasi: 'B',
    terkurasiAt: '2026-11-10',
    nomorSK: 'SK-KUR/001/XI/2026',
    deskripsi: 'Kain tenun asli buatan tangan perajin perempuan Kanekes Baduy Luar menggunakan alat tenun bukan mesin (ATBM) dengan pewarna alami.',
  },
  {
    id: 'prod-002',
    nama: 'Emping Melinjo Khas Lebak 250g',
    kategori: 'olahan_pangan',
    kategoriLabel: 'Olahan Pangan',
    subKomoditas: 'Emping Melinjo Super Tipis',
    namaUsaha: 'Berkah Melinjo Menes-Rangkas',
    kecamatan: 'Rangkasbitung',
    hargaAcuan: 28000,
    satuan: 'bungkus',
    kapasitasBulanan: 600,
    gradeKurasi: 'A',
    terkurasiAt: '2026-11-05',
    nomorSK: 'SK-KUR/002/XI/2026',
    deskripsi: 'Emping melinjo olahan perajin lokal dengan kualitas biji pilihan tanpa pengawet kimia, renyah, gurih, dan beraroma khas.',
  },
  {
    id: 'prod-003',
    nama: 'Madu Hutan Ujung Lebak Asli 500ml',
    kategori: 'olahan_pangan',
    kategoriLabel: 'Olahan Pangan',
    subKomoditas: 'Madu Odeng Murni',
    namaUsaha: 'Kelompok Tani Lebak Lestari',
    kecamatan: 'Cilograng',
    hargaAcuan: 110000,
    satuan: 'botol',
    kapasitasBulanan: 120,
    gradeKurasi: 'A',
    terkurasiAt: '2026-11-08',
    nomorSK: 'SK-KUR/003/XI/2026',
    deskripsi: 'Madu murni hasil panen lebah pohon Apis dorsata di kawasan hutan perbukitan Lebak Selatan, kadar air rendah & berkhasiat.',
  },
  {
    id: 'prod-004',
    nama: 'Gula Aren Organik Batok & Semut',
    kategori: 'olahan_pangan',
    kategoriLabel: 'Olahan Pangan',
    subKomoditas: 'Gula Semut Aren',
    namaUsaha: 'Koperasi Nira Mandiri Sobang',
    kecamatan: 'Sobang',
    hargaAcuan: 38000,
    satuan: 'kemasan 500g',
    kapasitasBulanan: 850,
    gradeKurasi: 'B',
    terkurasiAt: '2026-11-12',
    nomorSK: 'SK-KUR/004/XI/2026',
    deskripsi: 'Gula aren cetak dan bubuk kristal dari nira pohon aren pegunungan Halimun Salak, indeks glikemik rendah dan aroma harum alami.',
  },
];

export function CatalogPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKecamatan, setSelectedKecamatan] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [activeModalProduct, setActiveModalProduct] = useState(null);

  const filteredProducts = DUMMY_PRODUCTS.filter((prod) => {
    const matchesSearch =
      !searchTerm ||
      prod.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.subKomoditas.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.namaUsaha.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKec = !selectedKecamatan || prod.kecamatan === selectedKecamatan;
    const matchesKat = !selectedKategori || prod.kategori === selectedKategori;
    const matchesGrade = !selectedGrade || prod.gradeKurasi === selectedGrade;
    return matchesSearch && matchesKec && matchesKat && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* Banner Hero Publik */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
            <ShieldCheck className="w-4 h-4" />
            <span>Katalog Resmi Komoditas Terkurasi Kabupaten Lebak</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Etalase Produk Unggulan & Komoditas Ekspor UMKM Lebak
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Semua komoditas dalam katalog ini telah lolos proses kurasi berstandar resmi oleh Tim Kurator Dinas Koperasi & UKM Kabupaten Lebak dengan sertifikat verifikasi grade mutu A, B, atau C.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar Interaktif */}
      <Card className="p-4 bg-white shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama produk, komoditas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <select
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">Semua Kecamatan (28 Kecamatan)</option>
              {KECAMATAN.map((kec) => (
                <option key={kec} value={kec}>
                  {kec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">Semua Kategori Usaha</option>
              <option value="olahan_pangan">Olahan Pangan & Kuliner</option>
              <option value="kriya_tenun">Kriya & Tenun Baduy</option>
              <option value="pertanian_perkebunan">Pertanian & Perkebunan</option>
              <option value="jasa_wisata">Jasa & Produk Kreatif</option>
            </select>
          </div>

          <div>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
            >
              <option value="">Semua Grade Kurasi</option>
              <option value="A">Grade A (Siap Ekspor / Skala Besar)</option>
              <option value="B">Grade B (Standar Pasar Modern / B2B)</option>
              <option value="C">Grade C (Pasar Lokal Kabupaten)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Grid Kartu Produk Terkurasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((prod) => (
          <Card key={prod.id} className="overflow-hidden flex flex-col justify-between hover:shadow-lg transition">
            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    {prod.kategoriLabel}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2 line-clamp-1">{prod.nama}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Kecamatan {prod.kecamatan}</span>
                  </p>
                </div>
                <div
                  className={`px-3 py-1.5 rounded-xl font-black text-sm flex items-center gap-1 shadow-xs border ${
                    prod.gradeKurasi === 'A'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : prod.gradeKurasi === 'B'
                      ? 'bg-blue-50 text-blue-800 border-blue-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Grade {prod.gradeKurasi}</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{prod.deskripsi}</p>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px]">Harga Acuan</span>
                  <span className="font-bold text-slate-800">
                    Rp {prod.hargaAcuan.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-slate-500"> / {prod.satuan}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Kapasitas Produksi</span>
                  <span className="font-bold text-slate-800">
                    {prod.kapasitasBulanan} {prod.satuan}
                  </span>
                  <span className="text-[10px] text-slate-500"> / bulan</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{prod.namaUsaha}</span>
              </div>
            </div>

            <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono">No. SK: {prod.nomorSK}</span>
              <Button size="sm" variant="outline" onClick={() => setActiveModalProduct(prod)}>
                Detail & Kontak
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-semibold text-slate-700">Tidak ada komoditas yang cocok</h4>
          <p className="text-xs text-slate-500 mt-1">Coba sesuaikan kata kunci pencarian atau bersihkan filter Anda.</p>
        </div>
      )}

      {/* Modal Detail & Proteksi Kontak UMKM (AC-05-09) */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  {activeModalProduct.kategoriLabel}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">{activeModalProduct.nama}</h3>
                <p className="text-xs text-slate-500">{activeModalProduct.namaUsaha} - Kec. {activeModalProduct.kecamatan}</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                Grade {activeModalProduct.gradeKurasi}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {activeModalProduct.deskripsi}
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Harga Acuan</span>
                <span className="font-bold text-slate-800 text-sm">
                  Rp {activeModalProduct.hargaAcuan.toLocaleString('id-ID')} / {activeModalProduct.satuan}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-slate-400 block text-[10px]">Kapasitas Produksi</span>
                <span className="font-bold text-slate-800 text-sm">
                  {activeModalProduct.kapasitasBulanan} {activeModalProduct.satuan}/bulan
                </span>
              </div>
            </div>

            {/* Proteksi Kontak Sesuai Kriteria AC-05-09 */}
            {user ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold text-xs">
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Kontak Resmi Terverifikasi (Mitra / Akun Login)</span>
                </div>
                <p className="text-xs text-emerald-900 font-mono font-medium">WhatsApp: +62 812-8899-7722</p>
                <a
                  href="https://wa.me/6281288997722"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition"
                >
                  <span>Hubungi via WhatsApp</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <p className="text-xs text-amber-900 leading-relaxed">
                  <strong>Proteksi Kontak UMKM:</strong> Nomor WhatsApp dan kontak langsung pelaku usaha hanya dapat diakses oleh Mitra Bisnis / Pembeli B2B yang telah memiliki akun terdaftar dan terverifikasi.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <Link to="/login" className="px-3 py-1.5 bg-navy-900 text-white rounded-lg text-xs font-semibold hover:bg-navy-800">
                    Masuk Akun
                  </Link>
                  <Link to="/register" className="px-3 py-1.5 bg-amber-500 text-navy-950 rounded-lg text-xs font-semibold hover:bg-amber-400">
                    Daftar Mitra
                  </Link>
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setActiveModalProduct(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogPage;
