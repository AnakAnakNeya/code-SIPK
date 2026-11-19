// ============================================================================
// Halaman Dasbor Pelaku Usaha UMKM (frontend/src/pages/umkm/DashboardUmkmPage.jsx)
// [PBI-15] Dasbor Analitik Dinas dan Dasbor UMKM (FR-12)
// PIC: Naila | Aktor: umkm
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  Package,
  Award,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Plus,
  ShoppingBag,
  Sparkles,
  Calendar,
  MessageSquare,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function DashboardUmkmPage() {
  const { user } = useAuth();
  const business = user?.business;
  const isPending = user?.status === 'menunggu_persetujuan';
  const isRejected = user?.status === 'ditolak';
  const isActive = user?.status === 'aktif';

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isActive) {
      fetchSummary();
    } else {
      setLoading(false);
    }
  }, [isActive]);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/umkm');
      setSummary(res.data);
    } catch (err) {
      console.warn('Gagal memuat ringkasan dasbor UMKM:', err);
    } finally {
      setLoading(false);
    }
  };

  const produk = summary?.produk || { draf: 0, menunggu: 0, terkurasi: 0, total: 0 };
  const rfqCocok = summary?.rfqCocokCount || 0;
  const sintesaAktif = summary?.sintesaAktif;
  const eventCount = summary?.eventDiikutiCount || 0;
  const pengajuanTerakhir = summary?.pengajuanTerakhir || [];

  return (
    <div className="space-y-6">
      {/* Header Selamat Datang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Dasbor Pelaku Usaha Binaan
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-1">
            {business?.namaUsaha || 'Unit Usaha Anda'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kecamatan {business?.kecamatan || 'Lebak'} &bull; {user?.nama}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/umkm/profil">
            <Button variant="outline" size="sm" className="gap-2">
              <Building2 className="w-4 h-4" />
              <span>Profil Usaha</span>
            </Button>
          </Link>
          <Link to="/umkm/produk">
            <Button variant="primary" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span>Kelola Produk</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* AC-15-10: Banner Status untuk Akun Belum Aktif */}
      {isPending && (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-900 text-base">
                Pendaftaran Akun Sedang Diverifikasi Dinas
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Tim verifikator Dinas Koperasi & UMKM Kabupaten Lebak sedang memeriksa 13 digit NIB OSS-RBA dan berkas legalitas usaha Anda.
              </p>
            </div>
          </div>

          <div className="bg-white/80 p-4 rounded-xl border border-amber-100 text-xs text-slate-600 space-y-2">
            <p className="font-bold text-slate-800">Langkah berikutnya saat akun Anda Aktif:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Lengkapi foto produk dan ajukan kurasi mutu untuk meraih Grade A/B dinas.</li>
              <li>Ambil alokasi kuota pesanan besar (RFQ) dari jaringan mitra offtaker ritel.</li>
              <li>Daftar stan pameran gratis daerah dan fasilitasi Rumah Kemasan Sintesa.</li>
            </ol>
          </div>
        </div>
      )}

      {isRejected && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-rose-900 text-base">
                Pendaftaran Akun Ditolak oleh Dinas
              </h3>
              <p className="text-xs text-rose-700 mt-0.5">
                Berkas pendaftaran atau nomor NIB tidak sesuai dengan data kependudukan Kabupaten Lebak.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600">
            Silakan perbarui profil legalitas Anda di menu Profil Usaha atau hubungi kantor Dinas Koperasi & UMKM Lebak di Plaza Lebak Rangkasbitung.
          </p>
        </div>
      )}

      {/* Ringkasan Status Usaha (4 Kartu) - AC-15-08 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Status Akun Dinas</span>
            <div className="w-8 h-8 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <Badge status={user?.status} size="md" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            NIB: <span className="font-mono font-semibold text-slate-600">{business?.nib || '-'}</span>
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Produk Terkurasi</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy-900 mt-2">
            {produk.terkurasi} / {produk.total}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {produk.menunggu} Menunggu &bull; {produk.draf} Draf
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pesanan RFQ Cocok</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-navy-900 mt-2">{rfqCocok} Permintaan</p>
          <p className="text-[11px] text-slate-400 mt-1">Sesuai Komoditas Terkurasi Anda</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Agenda & Layanan</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-navy-900 mt-2">
            {sintesaAktif ? `Sintesa: ${sintesaAktif.status?.replace('_', ' ')}` : 'Sintesa: Belum Ada'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {eventCount} Pameran Terdaftar
          </p>
        </Card>
      </div>

      {/* Grid 2 Kolom: Aktivitas Pengajuan Terakhir & Pintasan Layanan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AC-15-09: Tabel Status Pengajuan Terbaru */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-navy-900 text-sm">Status Pengajuan Terakhir</h3>
              <p className="text-xs text-slate-400">Pemeriksaan mutu kurasi dan penerbitan SK</p>
            </div>
            <Link
              to="/umkm/produk"
              className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1"
            >
              <span>Semua Produk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {pengajuanTerakhir.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              Belum ada riwayat pengajuan kurasi.
            </p>
          ) : (
            <div className="space-y-3">
              {pengajuanTerakhir.map((sub) => (
                <div
                  key={sub._id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-navy-900">
                      {sub.productId?.nama || 'Produk'}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tanggal: {new Date(sub.createdAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <Badge status={sub.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Layanan Terintegrasi SIPK */}
        <Card className="p-5 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-navy-900 text-sm">Akses Cepat Fasilitasi Dinas</h3>
            <p className="text-xs text-slate-400">Tingkatkan omset dan legalitas melalui fasilitas Pemkab Lebak</p>
          </div>

          <div className="space-y-2.5">
            <Link
              to="/umkm/rfq"
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Agregasi Pesanan Offtaker (RFQ)</p>
                  <p className="text-[11px] text-slate-400">Komitmen pasokan bersama sesama UMKM binaan</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/umkm/event"
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Pendaftaran Stan Pameran & Pelatihan</p>
                  <p className="text-[11px] text-slate-400">Expo Hari Koperasi & pelatihan kemasan/halal</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/umkm/sintesa"
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Rumah Kemasan Sintesa</p>
                  <p className="text-[11px] text-slate-400">Subsidi cetak gratis & desain kemasan modern</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>

            <Link
              to="/forum"
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Forum Diskusi Komunitas UMKM</p>
                  <p className="text-[11px] text-slate-400">Tanya jawab izin halal, pasokan bahan baku & ritel</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardUmkmPage;
