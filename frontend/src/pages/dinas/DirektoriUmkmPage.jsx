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
  UserPlus,
  Key,
  Copy,
  Check,
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

  // State Daftarkan UMKM Manual oleh Dinas (AC-06-09)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    nama: '',
    email: '',
    noHp: '',
    namaUsaha: '',
    kecamatan: 'Rangkasbitung',
    kategoriUtama: 'olahan_pangan',
    subKomoditas: '',
    nib: '',
    alamat: '',
  });
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [createdResult, setCreatedResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualSubmitting(true);
    setErr(null);
    try {
      const res = await api.post('/umkm/manual', manualForm);
      setCreatedResult(res.data);
      loadData();
    } catch (e) {
      setErr(e.message || 'Gagal mendaftarkan UMKM');
    } finally {
      setManualSubmitting(false);
    }
  };

  const copyPassword = () => {
    if (createdResult?.temporaryPassword) {
      navigator.clipboard.writeText(createdResult.temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        <Button
          onClick={() => {
            setCreatedResult(null);
            setShowManualModal(true);
          }}
          className="bg-navy-900 hover:bg-navy-800 text-white gap-2 font-bold shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Daftarkan UMKM Manual</span>
        </Button>
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

      {/* Modal Pendaftaran UMKM Manual oleh Dinas (AC-06-09) */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            {createdResult ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-extrabold text-navy-900">
                    UMKM Berhasil Didaftarkan oleh Dinas
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Akun langsung berstatus <strong>Aktif</strong>. Berikan kata sandi sementara ini kepada pelaku usaha binaan.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Nama Usaha:</span>
                    <span className="font-bold text-navy-900">{createdResult.business?.namaUsaha}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">Email Login:</span>
                    <span className="font-bold text-navy-900 font-mono">{createdResult.user?.email}</span>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-600 font-bold block mb-1">Kata Sandi Sementara:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-amber-50 text-amber-900 font-mono font-extrabold px-3 py-2 rounded-lg border border-amber-300 text-sm tracking-wider">
                        {createdResult.temporaryPassword}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={copyPassword}
                        className="gap-1 font-bold shrink-0"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Tersalin' : 'Salin'}</span>
                      </Button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      *Pelaku usaha wajib mengganti kata sandi ini pada saat pertama kali login ke sistem SIPK-Lebak.
                    </p>
                  </div>
                </div>

                <Button
                  className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold"
                  onClick={() => setShowManualModal(false)}
                >
                  Selesai & Tutup
                </Button>
              </div>
            ) : (
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-navy-900 flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-amber-600" />
                      <span>Daftarkan UMKM Binaan Manual</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Fasilitasi pendataan UMKM desa (jemput bola lapangan oleh dinas).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualModal(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg leading-none"
                  >
                    &times;
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-navy-900 mb-1">Nama Pemilik Usaha *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Kang Asep"
                      value={manualForm.nama}
                      onChange={(e) => setManualForm({ ...manualForm, nama: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-navy-900 mb-1">Email Pengguna *</label>
                      <input
                        type="email"
                        required
                        placeholder="asep@arenjaya.id"
                        value={manualForm.email}
                        onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-navy-900 mb-1">No. WhatsApp / HP</label>
                      <input
                        type="tel"
                        placeholder="081234567890"
                        value={manualForm.noHp}
                        onChange={(e) => setManualForm({ ...manualForm, noHp: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-navy-900 mb-1">Nama Unit Usaha *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: KUB Aren Alami Sobang"
                      value={manualForm.namaUsaha}
                      onChange={(e) => setManualForm({ ...manualForm, namaUsaha: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-navy-900 mb-1">Kecamatan Sentra *</label>
                      <select
                        value={manualForm.kecamatan}
                        onChange={(e) => setManualForm({ ...manualForm, kecamatan: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 font-semibold"
                      >
                        {KECAMATAN.map((k) => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-navy-900 mb-1">Kategori Utama</label>
                      <select
                        value={manualForm.kategoriUtama}
                        onChange={(e) => setManualForm({ ...manualForm, kategoriUtama: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900 font-semibold"
                      >
                        <option value="olahan_pangan">Olahan Pangan</option>
                        <option value="kriya_tenun">Kriya & Tenun</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-navy-900 mb-1">Nomor Induk Berusaha (NIB)</label>
                      <input
                        type="text"
                        placeholder="13 digit angka OSS-RBA"
                        value={manualForm.nib}
                        onChange={(e) => setManualForm({ ...manualForm, nib: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-navy-900 mb-1">Sub-Komoditas</label>
                      <input
                        type="text"
                        placeholder="Gula Semut / Tenun Baduy"
                        value={manualForm.subKomoditas}
                        onChange={(e) => setManualForm({ ...manualForm, subKomoditas: e.target.value })}
                        className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-navy-900 mb-1">Alamat Sentra Usaha</label>
                    <textarea
                      rows={2}
                      placeholder="Kp. Guradog RT 02/03 Desa Kanekes..."
                      value={manualForm.alamat}
                      onChange={(e) => setManualForm({ ...manualForm, alamat: e.target.value })}
                      className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowManualModal(false)}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    loading={manualSubmitting}
                    className="bg-navy-900 hover:bg-navy-800 text-white font-bold"
                  >
                    Daftarkan & Terbitkan Akun
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default DirektoriUmkmPage;
