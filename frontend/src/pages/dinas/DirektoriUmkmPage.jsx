// ============================================================================
// [PBI-06] Direktori Binaan 28 Kecamatan & Persetujuan Akun Mandiri (FR-14)
// PIC: Naila
// Kriteria:
// - AC-06-01 & AC-06-02: Tabel direktori UMKM lengkap, pencarian, filter status & kecamatan
// - AC-06-03: Bar ringkasan sebaran binaan per 28 kecamatan Kabupaten Lebak
// - AC-06-06 & AC-06-07: Modal pemeriksaan berkas NIB dan tombol "Setujui" / "Tolak" akun
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Building2,
  FileText,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import api from '../../api/client.js';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { KECAMATAN } from '../../constants/kecamatan.js';

export function DirektoriUmkmPage() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [kecamatanFilter, setKecamatanFilter] = useState('all');

  const [activeVerify, setActiveVerify] = useState(null); // Modal verifikasi akun
  const [keputusan, setKeputusan] = useState('setuju');
  const [catatan, setCatatan] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [resList, resSummary] = await Promise.all([
        api.get(`/umkm?q=${searchTerm}&kecamatan=${kecamatanFilter}&statusAkun=${statusFilter}`),
        api.get('/umkm/summary'),
      ]);
      setItems(resList.data || []);
      setSummary(resSummary.data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, kecamatanFilter]);

  const handleVerify = async () => {
    if (keputusan === 'tolak' && !catatan) {
      setErr('Catatan alasan penolakan wajib diisi');
      return;
    }
    setVerifying(true);
    try {
      await api.patch(`/umkm/${activeVerify.id}/persetujuan`, {
        keputusan,
        catatan,
      });
      setMsg(`Akun usaha ${activeVerify.namaUsaha} berhasil di-${keputusan === 'setuju' ? 'setujui' : 'tolak'}.`);
      setActiveVerify(null);
      loadData();
    } catch (e) {
      setErr(e.message || 'Gagal memproses persetujuan akun');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Basis Data Binaan Dinas
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-1">Direktori UMKM 28 Kecamatan</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pencatatan legalitas izin, monitoring produk terkurasi, dan persetujuan pendaftaran mandiri.
          </p>
        </div>
      </div>

      {msg && <Alert type="success" onClose={() => setMsg(null)}>{msg}</Alert>}
      {err && <Alert type="error" onClose={() => setErr(null)}>{err}</Alert>}

      {/* Ringkasan Sebaran 28 Kecamatan (AC-06-03) */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-navy-900 uppercase">
            Ringkasan Sebaran Usaha Binaan (28 Kecamatan Lebak)
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {summary.slice(0, 10).map((s) => (
            <div
              key={s.kecamatan}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 shrink-0 text-center min-w-[90px]"
            >
              <span className="text-xs font-bold text-navy-900 block truncate">{s.kecamatan}</span>
              <span className="text-sm font-extrabold text-amber-600 font-mono">{s.total}</span>
              <span className="text-[10px] text-slate-400 block">UMKM</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Filter Bar & Pencarian */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama usaha, NIB, atau alamat..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">Semua Status Akun</option>
            <option value="menunggu_persetujuan">Menunggu Persetujuan</option>
            <option value="aktif">Aktif</option>
            <option value="ditolak">Ditolak</option>
            <option value="nonaktif">Nonaktif</option>
          </select>

          <select
            value={kecamatanFilter}
            onChange={(e) => setKecamatanFilter(e.target.value)}
            className="text-xs font-semibold py-2 px-3 rounded-lg border border-slate-300 bg-white text-slate-700"
          >
            <option value="all">Semua Kecamatan</option>
            {KECAMATAN.map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Direktori Binaan (AC-06-01) */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-4">Nama Usaha & Pemilik</th>
                <th className="p-4">Kecamatan</th>
                <th className="p-4">Kategori Komoditas</th>
                <th className="p-4">NIB (13 Digit)</th>
                <th className="p-4">Status Akun</th>
                <th className="p-4">Produk / Terkurasi</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-12 text-slate-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">Tidak ada UMKM yang sesuai filter</p>
                  </td>
                </tr>
              ) : (
                items.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4">
                      <div className="font-bold text-navy-900">{u.namaUsaha}</div>
                      <span className="text-[11px] text-slate-500">
                        {u.user?.nama || 'Pemilik'} ({u.user?.email})
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-700">Kec. {u.kecamatan}</td>
                    <td className="p-4 capitalize text-slate-600">
                      {u.kategoriUtama?.replace(/_/g, ' ')}
                    </td>
                    <td className="p-4 font-mono font-bold text-navy-900">{u.nib}</td>
                    <td className="p-4">
                      <Badge status={u.user?.status} size="sm" />
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      <span className="text-navy-900 font-bold">{u.totalProduk}</span> total &bull;{' '}
                      <span className="text-emerald-700 font-extrabold">{u.terkurasiProduk}</span> terkurasi
                    </td>
                    <td className="p-4 text-right">
                      {u.user?.status === 'menunggu_persetujuan' ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setActiveVerify(u);
                            setKeputusan('setuju');
                            setCatatan('');
                          }}
                          className="font-bold text-xs"
                        >
                          Periksa & Setujui
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveVerify(u);
                            setKeputusan('setuju');
                            setCatatan('');
                          }}
                          className="text-xs"
                        >
                          Detail Usaha
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Verifikasi Akun Baru (AC-06-06, AC-06-07) */}
      {activeVerify && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900">
              Persetujuan Akun: {activeVerify.namaUsaha}
            </h3>

            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Pemilik:</span>
                <span className="font-bold text-navy-900">{activeVerify.user?.nama}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">13 Digit NIB OSS-RBA:</span>
                <span className="font-mono font-bold text-navy-900">{activeVerify.nib}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kecamatan:</span>
                <span className="font-bold text-navy-900">{activeVerify.kecamatan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Saat Ini:</span>
                <Badge status={activeVerify.user?.status} size="sm" />
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Keputusan Verifikator:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800 text-xs">
                    <input
                      type="radio"
                      name="keputusan"
                      value="setuju"
                      checked={keputusan === 'setuju'}
                      onChange={() => setKeputusan('setuju')}
                    />
                    <span>Setujui Akun (Aktifkan)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-800 text-xs">
                    <input
                      type="radio"
                      name="keputusan"
                      value="tolak"
                      checked={keputusan === 'tolak'}
                      onChange={() => setKeputusan('tolak')}
                    />
                    <span>Tolak Pengajuan</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Catatan Verifikasi (Wajib jika ditolak):
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    keputusan === 'tolak'
                      ? 'Tuliskan alasan penolakan agar UMKM dapat memperbaiki...'
                      : 'Catatan opsional...'
                  }
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setActiveVerify(null)}>
                Batal
              </Button>
              <Button
                variant={keputusan === 'setuju' ? 'primary' : 'danger'}
                size="sm"
                loading={verifying}
                onClick={handleVerify}
                className="font-bold"
              >
                {keputusan === 'setuju' ? 'Simpan & Aktifkan Akun' : 'Kirim Penolakan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default DirektoriUmkmPage;
