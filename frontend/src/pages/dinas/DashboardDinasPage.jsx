import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  FileCheck,
  ShieldCheck,
  Building2,
  Package,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export function DashboardDinasPage() {
  const { user } = useAuth();
  const isKabid = user?.role === 'kabid';

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
          <Link to="/dinas/kurasi">
            <Button variant="primary" size="sm" className="gap-2">
              <FileCheck className="w-4 h-4" />
              <span>{isKabid ? 'Persetujuan Kurasi' : 'Antrean Pemeriksaan'}</span>
            </Button>
          </Link>
          <Link to="/dinas/umkm">
            <Button variant="outline" size="sm" className="gap-2">
              <Users className="w-4 h-4" />
              <span>Direktori Binaan</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Ringkasan Dinas (4 Kartu) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Antrean Verifikasi Akun</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">1 Akun Baru</p>
          <p className="text-[11px] text-slate-400 mt-1">Menunggu pemeriksaan NIB</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Antrean Kurasi Mutu</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">2 Pengajuan</p>
          <p className="text-[11px] text-slate-400 mt-1">1 Menunggu Staf, 1 Menunggu Kabid</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Binaan Terdata</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">3 UMKM</p>
          <p className="text-[11px] text-slate-400 mt-1">Tersebar di 28 Kecamatan</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Produk Lolos SK Dinas</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-navy-900 mt-2">2 Terkurasi</p>
          <p className="text-[11px] text-slate-400 mt-1">Siap Ritel Modern (Grade A/B)</p>
        </Card>
      </div>

      {/* Panel Navigasi Modul Verifikasi */}
      <Card>
        <CardHeader
          title="Tugas Utama Verifikator & Pimpinan Dinas"
          description="SOP verifikasi berjenjang untuk menjaga akuntabilitas lencana mutu Pemkab Lebak"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center font-bold">
                1
              </div>
              <h4 className="font-bold text-navy-900">Verifikasi NIB & Akun Binaan</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Periksa kesesuaian 13 digit NIB OSS-RBA dan salinan berkas pendaftaran mandiri pelaku usaha.
              </p>
              <Link to="/dinas/umkm" className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1">
                Buka Antrean Akun <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center font-bold">
                2
              </div>
              <h4 className="font-bold text-navy-900">Pemeriksaan Dokumen & Kemasan</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Staf memeriksa SPP-IRT, Halal, hasil uji umur simpan, dan kelayakan label kemasan produk.
              </p>
              <Link to="/dinas/kurasi" className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1">
                Periksa Kurasi <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="p-5 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-900 flex items-center justify-center font-bold">
                3
              </div>
              <h4 className="font-bold text-navy-900">Persetujuan & Terbit SK Kabid</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Kabid menetapkan Grade A/B, menerbitkan nomor SK resmi, dan menampilkan produk ke katalog mitra.
              </p>
              <Link to="/dinas/kurasi" className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1">
                Keputusan Kabid <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export default DashboardDinasPage;
