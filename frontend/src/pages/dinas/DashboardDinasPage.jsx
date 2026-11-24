// ============================================================================
// Halaman Dasbor Analitik Dinas (frontend/src/pages/dinas/DashboardDinasPage.jsx)
// Tampilan disesuaikan dengan desain stitch: sipk_lebak_dasbor_dinas_ibu_juli_zakiah
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';

export function DashboardDinasPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/dinas');
      setData(res.data);
    } catch (err) {
      console.warn('Gagal memuat dasbor dinas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open('/api/v1/dashboard/dinas/export', '_blank');
  };

  const kpi = data?.kpi || {
    umkmTerdaftar: 248,
    produkLolosKurasi: 184,
    rfqTerpenuhi: 14,
    antreanSintesa: 38,
  };

  // Mock list antrean hari ini sesuai desain stitch jika belum ada transaksi di DB
  const antreanVerifikasi = [
    {
      id: 'av-1',
      produk: 'Sirup Nira Aren Murni 250ml',
      usaha: 'KUB Aren Jaya Sobang',
      kecamatan: 'Kec. Sobang',
      dokumen: 'NIB, SPP-IRT, Uji Labkesda',
      waktu: 'Hari ini, 08:30 WIB',
      status: 'Menunggu Verifikasi',
    },
    {
      id: 'av-2',
      produk: 'Tenun Ikat Motif Koja Baduy',
      usaha: 'Sanggar Tenun Ambu Kanekes',
      kecamatan: 'Kec. Leuwidamar',
      dokumen: 'NIB, HKI Merek Dagang',
      waktu: 'Hari ini, 09:15 WIB',
      status: 'Menunggu Verifikasi',
    },
    {
      id: 'av-3',
      produk: 'Kopi Robusta Hariang Roast 200g',
      usaha: 'Poktan Barokah Kopi Lebak',
      kecamatan: 'Kec. Sobang',
      dokumen: 'NIB, P-IRT, Sertifikat Halal',
      waktu: 'Hari ini, 10:00 WIB',
      status: 'Menunggu Verifikasi',
    },
    {
      id: 'av-4',
      produk: 'Sale Pisang Siuh Renyah 250g',
      usaha: 'UMKM Barokah Salepisan',
      kecamatan: 'Kec. Cibadak',
      dokumen: 'NIB, Sertifikat Halal, Uji Mutu',
      waktu: 'Hari ini, 11:20 WIB',
      status: 'Menunggu Verifikasi',
    },
    {
      id: 'av-5',
      produk: 'Tas Koja Serat Teureup Alami',
      usaha: 'Kriya Etnik Kanekes',
      kecamatan: 'Kec. Leuwidamar',
      dokumen: 'NIB, Kurasi Kriya Provinsi',
      waktu: 'Hari ini, 13:05 WIB',
      status: 'Menunggu Verifikasi',
    },
  ];

  // Sebaran kecamatan sesuai stitch mockup
  const sebaranKecamatan = [
    { kec: 'Kec. Rangkasbitung', aktif: 62, legal: 48, pctAktif: 85, pctLegal: 65 },
    { kec: 'Kec. Leuwidamar', aktif: 48, legal: 36, pctAktif: 70, pctLegal: 52 },
    { kec: 'Kec. Sobang', aktif: 34, legal: 28, pctAktif: 55, pctLegal: 44 },
    { kec: 'Kec. Cibadak', aktif: 28, legal: 20, pctAktif: 45, pctLegal: 33 },
    { kec: 'Kec. Malingping', aktif: 24, legal: 18, pctAktif: 40, pctLegal: 30 },
  ];

  return (
    <div className="space-y-6">
      {/* Header Dasbor */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">
            Dasbor Analitik Pembinaan & Pengawasan
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Monitoring kinerja kurasi, legalitas 28 kecamatan, dan antrean verifikasi komoditas unggulan Kabupaten Lebak.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-[#1E3A8A] text-white text-xs font-semibold rounded-lg transition self-start shrink-0 shadow-xs"
        >
          <Download className="w-4 h-4" />
          <span>Unduh Rekapitulasi (.xlsx)</span>
        </button>
      </div>

      {/* 4 Kartu KPI Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Dark Navy Card */}
        <div className="bg-navy-900 text-white rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-medium text-slate-300">UMKM Produk Terdaftar</p>
          <div className="my-2">
            <p className="text-3xl font-extrabold text-white">{kpi.umkmTerdaftar}</p>
          </div>
          <p className="text-[11px] text-slate-400">+12 unit bulan berjalan</p>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-600">Produk Lolos Kurasi</p>
          <div className="my-2">
            <p className="text-3xl font-extrabold text-navy-900">{kpi.produkLolosKurasi}</p>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">74.2% dari total pengajuan</p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-600">RFQ Terpenuhi</p>
          <div className="my-2">
            <p className="text-3xl font-extrabold text-navy-900">{kpi.rfqTerpenuhi}</p>
          </div>
          <p className="text-[11px] text-emerald-600 font-semibold">Agregasi kemitraan aktif</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <p className="text-xs font-semibold text-slate-600">Antrean Sintesa</p>
          <div className="my-2">
            <p className="text-3xl font-extrabold text-navy-900">{kpi.antreanSintesa}</p>
          </div>
          <p className="text-[11px] text-amber-600 font-semibold">Proses perbaikan kemasan</p>
        </div>
      </div>

      {/* Tabel: Antrean Verifikasi Hari Ini */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-navy-900">Antrean Verifikasi Hari Ini</h3>
          <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            5 Pengajuan Menunggu Tinjauan
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Nama Produk & Komoditas</th>
                <th className="px-4 py-3">Pelaku Usaha</th>
                <th className="px-4 py-3">Kecamatan</th>
                <th className="px-4 py-3">Kelengkapan Dokumen</th>
                <th className="px-4 py-3">Waktu Pengajuan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-5 py-3 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {antreanVerifikasi.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-5 py-4 font-bold text-navy-900">{item.produk}</td>
                  <td className="px-4 py-4 text-slate-700">{item.usaha}</td>
                  <td className="px-4 py-4 text-slate-600">{item.kecamatan}</td>
                  <td className="px-4 py-4 text-slate-500">{item.dokumen}</td>
                  <td className="px-4 py-4 text-slate-500">{item.waktu}</td>
                  <td className="px-4 py-4">
                    <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {item.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to="/dinas/kurasi"
                      className="inline-block px-3 py-1.5 bg-navy-900 hover:bg-[#1E3A8A] text-white text-[11px] font-semibold rounded-md transition"
                    >
                      Verifikasi Berkas
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grid 2 Kolom: Distribusi Kecamatan & Agenda Pembinaan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Distribusi Komoditas (2/3 lebar) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-navy-900">Distribusi Komoditas per Kecamatan Utama</h3>
            <span className="text-xs text-slate-400">Cakupan 28 Kecamatan</span>
          </div>

          <div className="space-y-4">
            {sebaranKecamatan.map((k) => (
              <div key={k.kec} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{k.kec}</span>
                  <span className="text-slate-500 text-[11px]">
                    <strong>{k.aktif} Aktif</strong> / {k.legal} Legalitas Lengkap
                  </span>
                </div>
                {/* Bar 1: Navy UMKM Aktif */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-navy-900 rounded-full" style={{ width: `${k.pctAktif}%` }} />
                </div>
                {/* Bar 2: Emerald Legalitas Lengkap */}
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${k.pctLegal}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-navy-900" />
              <span>UMKM Aktif Berproduksi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-600" />
              <span>Legalitas & Sertifikasi Lengkap</span>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Agenda Pembinaan Terdekat (1/3 lebar) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-navy-900">Agenda Pembinaan Terdekat</h3>
            <Link to="/dinas/event" className="text-xs text-[#1E3A8A] font-semibold hover:underline">
              Semua
            </Link>
          </div>

          <div className="space-y-3.5">
            <div className="flex items-start gap-3.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0">
                <span className="text-base font-extrabold text-navy-900 leading-none">14</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">NOV</span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-navy-900 leading-snug">
                  Pelatihan Kemasan Pouch Alumunium
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">Aula PLUT KUMKM Lebak &bull; 35 Pelaku Usaha</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0">
                <span className="text-base font-extrabold text-navy-900 leading-none">19</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">NOV</span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-navy-900 leading-snug">
                  Uji Mutu Laboratorium Komoditas Olahan
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">Labkesda Kab. Lebak &bull; Batch Uji 04</p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
              <div className="w-12 h-12 rounded-lg bg-white border border-slate-200 flex flex-col items-center justify-center shrink-0">
                <span className="text-base font-extrabold text-navy-900 leading-none">27</span>
                <span className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">NOV</span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-navy-900 leading-snug">
                  Fasilitasi Sertifikasi Halal Reguler 2026
                </h4>
                <p className="text-[11px] text-slate-500 mt-1">Gedung Koperasi Kartini &bull; Sesi Verifikasi Fisik</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardDinasPage;
