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
    subKomoditas: 'Emping Melinjo Super',
    namaUsaha: 'KUB Aren Jaya Sobang',
    kecamatan: 'Sobang',
    hargaAcuan: 22000,
    satuan: 'pak',
    kapasitasBulanan: 200,
    gradeKurasi: 'A',
    terkurasiAt: '2026-11-12',
    nomorSK: 'SK-KUR/002/XI/2026',
    deskripsi: 'Emping melinjo renyah kualitas super dari perkebunan rakyat Sobang, higienis, berizin SPP-IRT dan bersertifikat Halal.',
  },
];

export function CatalogPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKategori, setSelectedKategori] = useState('all');
  const [selectedKecamatan, setSelectedKecamatan] = useState('all');

  const filtered = DUMMY_PRODUCTS.filter((p) => {
    const matchSearch =
      p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.namaUsaha.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.subKomoditas.toLowerCase().includes(searchTerm.toLowerCase());
    const matchKategori = selectedKategori === 'all' || p.kategori === selectedKategori;
    const matchKecamatan = selectedKecamatan === 'all' || p.kecamatan === selectedKecamatan;
    return matchSearch && matchKategori && matchKecamatan;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header Publik */}
      <header className="bg-navy-900 text-white border-b border-navy-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-navy-950 font-extrabold flex items-center justify-center text-base shadow">
              SL
            </div>
            <div>
              <h1 className="font-extrabold text-sm sm:text-base tracking-wide text-white">
                SIPK-LEBAK
              </h1>
              <p className="text-[11px] text-slate-400">Katalog Komoditas Terkurasi Dinas</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <Link to={user.role === 'umkm' ? '/umkm/dasbor' : '/dinas/dasbor'}>
                <Button variant="secondary" size="sm">
                  Ke Dasbor ({user.role})
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-white hover:text-white">
                    Masuk
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="sm">
                    Daftar UMKM
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Banner Katalog */}
      <section className="bg-gradient-to-b from-navy-900 to-navy-800 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy-800 text-amber-400 border border-navy-700">
            <ShieldCheck className="w-3.5 h-3.5" />
            Standardisasi Mutu & Legalitas Pemkab Lebak
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Etalase Komoditas Unggulan Lebak
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Temukan produk kriya tenun dan olahan pangan asli Kabupaten Lebak yang telah lolos verifikasi
            izin edar, keaslian sentra, dan penilaian mutu resmi.
          </p>

          {/* Bar Pencarian */}
          <div className="pt-4 max-w-2xl mx-auto">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari produk, nama usaha, atau komoditas (misal: Tenun, Gula Aren)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-sm text-slate-900 bg-white rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Container Katalog */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedKategori('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                selectedKategori === 'all'
                  ? 'bg-navy-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Semua Kategori
            </button>
            <button
              onClick={() => setSelectedKategori('olahan_pangan')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                selectedKategori === 'olahan_pangan'
                  ? 'bg-navy-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Olahan Pangan
            </button>
            <button
              onClick={() => setSelectedKategori('kriya_tenun')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                selectedKategori === 'kriya_tenun'
                  ? 'bg-navy-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              Kriya & Tenun
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-semibold shrink-0">Kecamatan:</span>
            <select
              value={selectedKecamatan}
              onChange={(e) => setSelectedKecamatan(e.target.value)}
              className="text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-navy-900"
            >
              <option value="all">Semua 28 Kecamatan</option>
              {KECAMATAN.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid Produk Terkurasi */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
            <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-navy-900">Belum ada produk yang sesuai filter</h3>
            <p className="text-xs text-slate-500 mt-1">
              Coba reset pencarian atau pilih kecamatan lainnya.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchTerm('');
                setSelectedKategori('all');
                setSelectedKecamatan('all');
              }}
            >
              Reset Filter
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <Card key={item.id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                <div>
                  {/* Foto Mockup / Placeholder */}
                  <div className="h-48 bg-gradient-to-tr from-slate-200 to-slate-100 relative flex items-center justify-center text-slate-400">
                    <ShoppingBag className="w-12 h-12 opacity-40" />
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-navy-900 text-amber-400 shadow">
                        Terkurasi Dinas
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-extrabold shadow ${
                        item.gradeKurasi === 'A' ? 'bg-amber-500 text-navy-950' : 'bg-slate-800 text-white'
                      }`}>
                        Grade {item.gradeKurasi}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-600" />
                      <span>Kec. {item.kecamatan}</span>
                      <span>&bull;</span>
                      <span className="font-semibold text-navy-900">{item.namaUsaha}</span>
                    </div>

                    <h3 className="font-bold text-base text-navy-900 line-clamp-1 mb-2">
                      {item.nama}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                      {item.deskripsi}
                    </p>

                    <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Harga Acuan</span>
                        <span className="text-base font-extrabold text-navy-900">
                          Rp{item.hargaAcuan.toLocaleString('id-ID')}
                        </span>
                        <span className="text-[11px] text-slate-500"> /{item.satuan}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 block">Kapasitas Bulanan</span>
                        <span className="text-xs font-bold text-slate-700">
                          {item.kapasitasBulanan} {item.satuan}/bln
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-mono">
                    SK: {item.nomorSK}
                  </span>
                  {user ? (
                    <Button variant="secondary" size="sm" className="gap-1.5 text-xs font-bold">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Hubungi UMKM</span>
                    </Button>
                  ) : (
                    <Link to="/login">
                      <Button variant="outline" size="sm" className="text-xs">
                        Masuk untuk Kontak
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Footer Publik */}
      <footer className="bg-navy-900 text-white py-6 border-t border-navy-800 text-center text-xs text-slate-400">
        <p>&copy; {new Date().getFullYear()} Dinas Koperasi dan UMKM Kabupaten Lebak &bull; SIPK-Lebak</p>
      </footer>
    </div>
  );
}
export default CatalogPage;
