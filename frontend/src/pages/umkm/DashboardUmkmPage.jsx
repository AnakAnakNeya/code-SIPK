import React from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function DashboardUmkmPage() {
  const { user } = useAuth();
  const business = user?.business;

  return (
    <div className="space-y-6">
      {/* Header Selamat Datang */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Dasbor Pelaku Usaha
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

      {/* Ringkasan Status Usaha (4 Kartu) */}
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
            Verifikasi NIB oleh Staf Dinas
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Nomor Induk Berusaha</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-navy-900 mt-2 font-mono">
            {business?.nib || '13 digit NIB'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Kategori: {business?.kategoriUtama === 'kriya_tenun' ? 'Kriya & Tenun' : 'Olahan Pangan'}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Komoditas Utama</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-navy-900 mt-2 truncate">
            {business?.subKomoditas?.join(', ') || 'Belum diisi'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Mulai beroperasi tahun {business?.tahunMulai || '-'}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Lencana Kurasi</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg font-extrabold text-navy-900 mt-2">
            0 Produk Lolos
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Standar Mutu Pemkab Lebak
          </p>
        </Card>
      </div>

      {/* Alur Tahapan UMKM Menuju Kurasi */}
      <Card>
        <CardHeader
          title="Tahapan Kurasi & Kemitraan SIPK-Lebak"
          description="Ikuti 4 langkah terstruktur untuk mendapatkan lencana Terkurasi Dinas"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>1. Registrasi Akun</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Akun telah tercatat. Menunggu tinjauan berkas NIB oleh verifikator dinas.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50">
              <div className="flex items-center gap-2 text-amber-800 font-bold text-sm mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>2. Lengkapi Dokumen</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unggah salinan berkas NIB, SPP-IRT, Halal, atau uji masa simpan di menu Legalitas.
              </p>
              <Link to="/umkm/profil" className="text-xs font-bold text-amber-700 hover:underline mt-3 inline-block">
                Ke Berkas &rarr;
              </Link>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
                <Package className="w-4 h-4 text-slate-500" />
                <span>3. Tambah Produk</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Unggah foto kemasan, tentukan kapasitas produksi per bulan, lalu klik "Ajukan Kurasi".
              </p>
              <Link to="/umkm/produk" className="text-xs font-bold text-navy-900 hover:underline mt-3 inline-block">
                Kelola Produk &rarr;
              </Link>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-2">
                <Award className="w-4 h-4 text-slate-500" />
                <span>4. Lencana & Ritel</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Persetujuan Kabid menerbitkan SK Kurasi (Grade A/B), masuk katalog mitra dan RFQ pesanan.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default DashboardUmkmPage;
