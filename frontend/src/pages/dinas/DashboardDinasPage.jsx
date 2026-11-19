// ============================================================================
// Halaman Dasbor Analitik Dinas (frontend/src/pages/dinas/DashboardDinasPage.jsx)
// [PBI-15] Dasbor Analitik Dinas dan Dasbor UMKM (FR-12)
// PIC: Naila | Aktor: staf, kabid
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileCheck,
  ShieldCheck,
  Building2,
  Package,
  ShoppingBag,
  Sparkles,
  Calendar,
  MessageSquare,
  ArrowRight,
  Download,
  Filter,
  CheckCircle,
  Clock,
  Pin,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export function DashboardDinasPage() {
  const { user } = useAuth();
  const isKabid = user?.role === 'kabid';

  const [periode, setPeriode] = useState('30d'); // '30d' | '90d' | 'tahun'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAllKecamatan, setShowAllKecamatan] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [periode]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/dinas', { params: { periode } });
      setData(res.data);
    } catch (err) {
      console.warn('Gagal memuat dasbor dinas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.open(`/api/v1/dashboard/dinas/export?periode=${periode}`, '_blank');
  };

  const kpi = data?.kpi || {
    umkmTerdaftar: 0,
    produkLolosKurasi: 0,
    rfqTerpenuhi: 0,
    antreanSintesa: 0,
  };

  const antrean = data?.antreanHariIni || {
    akunMenunggu: 0,
    kurasiMenungguVerifikasi: 0,
    kurasiMenungguApproval: 0,
    rfqMenungguVerifikasi: 0,
    rfqKuotaPenuh: 0,
  };

  const sebaran = data?.sebaranKecamatan || [];
  const topKecamatan = showAllKecamatan ? sebaran : sebaran.slice(0, 6);
  const maxAktif = Math.max(...sebaran.map((s) => s.aktif), 1);

  return (
    <div className="space-y-6">
      {/* Header Dinas */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            {isKabid ? 'Dasbor Eksekutif Kepala Bidang' : 'Dasbor Tim Verifikator Dinas'}
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-1">
            Dinas Koperasi & UMKM Kabupaten Lebak
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selamat bertugas, <strong>{user?.nama}</strong> &bull; Peran: {user?.role?.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter Periode */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 text-xs">
            <button
              type="button"
              onClick={() => setPeriode('30d')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                periode === '30d' ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriode('90d')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                periode === '90d' ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              90 Hari
            </button>
            <button
              type="button"
              onClick={() => setPeriode('tahun')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                periode === 'tahun' ? 'bg-navy-900 text-white' : 'text-slate-600 hover:text-navy-900'
              }`}
            >
              Tahun Ini
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Rekap (.xlsx)</span>
          </Button>
        </div>
      </div>

      {/* 4 Kartu KPI Utama (AC-15-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">UMKM Binaan Aktif</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-navy-900 mt-2">{kpi.umkmTerdaftar}</p>
          <p className="text-[11px] text-slate-400 mt-1">Tersebar di 28 Kecamatan</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Produk Lolos Kurasi</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-navy-900 mt-2">{kpi.produkLolosKurasi}</p>
          <p className="text-[11px] text-slate-400 mt-1">Grade A & B Terbit SK</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">RFQ Terpenuhi</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-navy-900 mt-2">{kpi.rfqTerpenuhi}</p>
          <p className="text-[11px] text-slate-400 mt-1">Pesanan Offtaker Periode Ini</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Antrean Sintesa</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-black text-navy-900 mt-2">{kpi.antreanSintesa}</p>
          <p className="text-[11px] text-slate-400 mt-1">Layanan Desain & Kemasan</p>
        </Card>
      </div>

      {/* Grid 2 Kolom: Antrean Hari Ini & Sebaran Kecamatan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Antrean Hari Ini (AC-15-03) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-navy-900 text-sm">Antrean Tugas Hari Ini</h3>
              <p className="text-xs text-slate-400">Pemeriksaan dan persetujuan yang menunggu tindakan</p>
            </div>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full border border-amber-200">
              SOP Dinas
            </span>
          </div>

          <div className="space-y-2.5">
            <Link
              to="/dinas/umkm"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Akun UMKM Menunggu Verifikasi</p>
                  <p className="text-[11px] text-slate-400">Pemeriksaan NIB dan kelengkapan profil</p>
                </div>
              </div>
              <span className="text-sm font-black text-amber-700 font-mono px-2.5 py-0.5 rounded-full bg-amber-50">
                {antrean.akunMenunggu}
              </span>
            </Link>

            <Link
              to="/dinas/kurasi"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Kurasi Menunggu Verifikasi Staf</p>
                  <p className="text-[11px] text-slate-400">Penilaian administrasi, izin & rasa produk</p>
                </div>
              </div>
              <span className="text-sm font-black text-blue-700 font-mono px-2.5 py-0.5 rounded-full bg-blue-50">
                {antrean.kurasiMenungguVerifikasi}
              </span>
            </Link>

            {isKabid && (
              <Link
                to="/dinas/kurasi"
                className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 hover:bg-purple-100/50 transition border border-purple-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-purple-900">Kurasi Menunggu Approval Kabid</p>
                    <p className="text-[11px] text-purple-600">Penerbitan Surat Keputusan (SK) Lencana</p>
                  </div>
                </div>
                <span className="text-sm font-black text-purple-700 font-mono px-2.5 py-0.5 rounded-full bg-white">
                  {antrean.kurasiMenungguApproval}
                </span>
              </Link>
            )}

            <Link
              to="/dinas/rfq"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">RFQ Menunggu Verifikasi Dinas</p>
                  <p className="text-[11px] text-slate-400">Pemeriksaan draf permintaan offtaker</p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-700 font-mono px-2.5 py-0.5 rounded-full bg-emerald-50">
                {antrean.rfqMenungguVerifikasi}
              </span>
            </Link>

            <Link
              to="/dinas/rfq"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">RFQ Kuota Terpenuhi 100%</p>
                  <p className="text-[11px] text-slate-400">Siap verifikasi alokasi & terbitkan PO PDF</p>
                </div>
              </div>
              <span className="text-sm font-black text-indigo-700 font-mono px-2.5 py-0.5 rounded-full bg-indigo-50">
                {antrean.rfqKuotaPenuh}
              </span>
            </Link>
          </div>
        </Card>

        {/* Sebaran UMKM per Kecamatan (AC-15-02) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-navy-900 text-sm">Sebaran UMKM per Wilayah</h3>
              <p className="text-xs text-slate-400">Cakupan binaan pada 28 kecamatan Kabupaten Lebak</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAllKecamatan(!showAllKecamatan)}
              className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1"
            >
              {showAllKecamatan ? (
                <>
                  <span>Tampilkan 6 Teratas</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Lihat Semua (28)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {topKecamatan.map((item) => {
              const barPct = Math.round((item.aktif / maxAktif) * 100);

              return (
                <div key={item.kecamatan} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">{item.kecamatan}</span>
                    <span className="font-mono font-bold text-navy-900">{item.aktif} UMKM</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-navy-900 to-amber-500 rounded-full"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Grid 2 Kolom: Agenda Event Terdekat & Forum Komunitas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda Pembinaan (AC-15-04) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-navy-900 text-sm">Agenda Pembinaan & Event Terdekat</h3>
              <p className="text-xs text-slate-400">Jadwal pameran dan pelatihan mendatang</p>
            </div>
            <Link
              to="/dinas/event"
              className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1"
            >
              <span>Kelola Event</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!data?.agendaEvent || data.agendaEvent.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Tidak ada agenda event terbuka saat ini.
            </p>
          ) : (
            <div className="space-y-3">
              {data.agendaEvent.map((ev) => (
                <div
                  key={ev._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 uppercase">
                      {ev.jenis}
                    </span>
                    <h4 className="text-xs font-bold text-navy-900 mt-1">{ev.nama}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{new Date(ev.tanggalMulai).toLocaleDateString('id-ID')}</span>
                      <span>&bull;</span>
                      <span className="truncate max-w-[150px]">{ev.lokasi}</span>
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-700 block">
                      {ev.terisi} / {ev.kuota}
                    </span>
                    <span className="text-[10px] text-slate-400">Stan Terisi</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Forum Komunitas Terbaru (AC-15-05) */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-navy-900 text-sm">Diskusi Forum Komunitas Terbaru</h3>
              <p className="text-xs text-slate-400">Konsultasi regulasi, kemasan, dan bahan baku</p>
            </div>
            <Link
              to="/forum"
              className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1"
            >
              <span>Buka Forum</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!data?.forumTerbaru || data.forumTerbaru.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Belum ada topik diskusi forum.
            </p>
          ) : (
            <div className="space-y-3">
              {data.forumTerbaru.map((th) => (
                <Link
                  key={th._id}
                  to="/forum"
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition block"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {th.pinned && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-navy-900 bg-amber-100 px-1.5 py-0.2 rounded">
                        <Pin className="w-2.5 h-2.5" /> Disematkan
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-500 uppercase">
                      {th.kategori?.replace('_', ' ')}
                    </span>
                    {th.terjawabDinas && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                        Terjawab Dinas
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-navy-900 line-clamp-1">{th.judul}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>
                      Oleh: <strong>{th.authorNama}</strong> ({th.authorKecamatan})
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                      <MessageSquare className="w-3 h-3" />
                      {th.replyCount} balasan
                    </span>
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default DashboardDinasPage;
