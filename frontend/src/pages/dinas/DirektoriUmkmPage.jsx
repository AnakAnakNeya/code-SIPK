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
  Download,
  FileSpreadsheet,
  AlertCircle,
  Package,
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

  const [activeVerify, setActiveVerify] = useState(null); // Modal verifikasi & detail akun (AC-06-04)
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailTab, setDetailTab] = useState('profil');
  const [keputusan, setKeputusan] = useState('setuju');
  const [catatan, setCatatan] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Buka detail akun dan muat dokumen serta produk (AC-06-04)
  const openDetail = async (u, defaultKeputusan = 'setuju') => {
    setActiveVerify(u);
    setKeputusan(defaultKeputusan);
    setCatatan('');
    setDetailTab('profil');
    setDetailLoading(true);
    try {
      const res = await api.get(`/umkm/${u.id}`);
      setDetailData(res.data);
    } catch {
      setDetailData(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Ekspor Data ke Excel .xlsx (AC-06-10)
  const handleExportExcel = async () => {
    setExporting(true);
    setErr(null);
    try {
      const response = await api.get(
        `/umkm/export?q=${encodeURIComponent(searchTerm)}&kecamatan=${kecamatanFilter}&statusAkun=${statusFilter}`,
        { responseType: 'blob' },
      );
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Direktori_UMKM_Lebak_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setMsg('Data direktori binaan UMKM berhasil diekspor ke file Excel (.xlsx)');
    } catch (e) {
      setErr(e.message || 'Gagal mengekspor data ke Excel');
    } finally {
      setExporting(false);
    }
  };

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
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            loading={exporting}
            className="gap-2 font-bold border-slate-300 hover:bg-slate-50 text-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Ekspor Excel (.xlsx)</span>
          </Button>
          <Button
            onClick={() => {
              setCreatedResult(null);
              setShowManualModal(true);
            }}
            className="bg-navy-900 hover:bg-navy-800 text-white gap-2 font-bold"
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftarkan UMKM Manual</span>
          </Button>
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

      {/* Filter Bar & Pencarian (Rapi & Responsif) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari nama usaha, nomor NIB, atau alamat sentra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-10 pr-9 text-xs rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white focus:bg-white transition focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition"
            >
              <Check className="w-3.5 h-3.5 hidden" />
              &times;
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 appearance-none hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900 cursor-pointer transition"
            >
              <option value="all">Semua Status Akun</option>
              <option value="menunggu_persetujuan">Menunggu Persetujuan</option>
              <option value="aktif">Aktif</option>
              <option value="ditolak">Ditolak</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative min-w-[180px]">
            <select
              value={kecamatanFilter}
              onChange={(e) => setKecamatanFilter(e.target.value)}
              className="w-full h-10 pl-3 pr-8 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 appearance-none hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900/15 focus:border-navy-900 cursor-pointer transition"
            >
              <option value="all">Semua Kecamatan (28 Wilayah)</option>
              {KECAMATAN.map((k) => (
                <option key={k} value={k}>
                  Kec. {k}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(searchTerm || statusFilter !== 'all' || kecamatanFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setKecamatanFilter('all');
              }}
              className="h-10 px-3 text-xs font-bold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-xl transition border border-rose-200"
            >
              Reset
            </button>
          )}
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
                          onClick={() => openDetail(u, 'setuju')}
                          className="font-bold text-xs"
                        >
                          Periksa & Setujui
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDetail(u, 'setuju')}
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

      {/* Modal Detail Usaha, Dokumen Legalitas & Persetujuan Akun (AC-06-04, AC-06-06, AC-06-07) */}
      {activeVerify && (
        <div className="fixed inset-0 z-50 bg-navy-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-navy-900">
                    {activeVerify.namaUsaha}
                  </h3>
                  <Badge status={activeVerify.user?.status} size="sm" />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kecamatan {activeVerify.kecamatan} &bull; NIB: <span className="font-mono font-bold text-navy-900">{activeVerify.nib}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveVerify(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Navigasi Tab Detail (AC-06-04) */}
            <div className="flex border-b border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDetailTab('profil')}
                className={`py-2 px-4 border-b-2 transition flex items-center gap-1.5 ${
                  detailTab === 'profil'
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Profil & Kontak</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('dokumen')}
                className={`py-2 px-4 border-b-2 transition flex items-center gap-1.5 ${
                  detailTab === 'dokumen'
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Dokumen Izin ({detailData?.documents?.length || 0})</span>
              </button>
              <button
                type="button"
                onClick={() => setDetailTab('produk')}
                className={`py-2 px-4 border-b-2 transition flex items-center gap-1.5 ${
                  detailTab === 'produk'
                    ? 'border-navy-900 text-navy-900'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Produk ({detailData?.products?.length || 0})</span>
              </button>
            </div>

            {/* Konten Tab */}
            <div className="flex-1 overflow-y-auto space-y-4 text-xs">
              {detailLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-8 h-8 border-4 border-navy-900 border-t-amber-500 rounded-full animate-spin mx-auto mb-2" />
                  <p>Memuat rincian berkas UMKM...</p>
                </div>
              ) : (
                <>
                  {/* TAB 1: PROFIL & KONTAK */}
                  {detailTab === 'profil' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Nama Pemilik</span>
                          <span className="font-bold text-navy-900">{activeVerify.user?.nama || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Alamat Email</span>
                          <span className="font-mono font-medium text-slate-700">{activeVerify.user?.email || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Nomor WhatsApp</span>
                          <span className="font-medium text-slate-700">{activeVerify.waUsaha || activeVerify.user?.noHp || '-'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Tahun Mulai Berdiri</span>
                          <span className="font-bold text-navy-900">{activeVerify.tahunMulai || '-'}</span>
                        </div>
                      </div>

                      <div className="p-3.5 bg-slate-50 rounded-xl space-y-2">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Alamat Sentra Usaha</span>
                          <span className="font-medium text-slate-700 leading-relaxed">{activeVerify.alamat || '-'}</span>
                        </div>
                        <div className="flex gap-4 pt-1">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Kategori</span>
                            <span className="font-bold text-navy-900 capitalize">
                              {activeVerify.kategoriUtama?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[11px]">Sub-Komoditas</span>
                            <span className="font-medium text-slate-700">
                              {Array.isArray(activeVerify.subKomoditas) ? activeVerify.subKomoditas.join(', ') : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DOKUMEN LEGALITAS */}
                  {detailTab === 'dokumen' && (
                    <div className="space-y-3">
                      {!detailData?.documents?.some((d) => d.jenis === 'nib') && (
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Salinan Berkas NIB Belum Diunggah</p>
                            <p className="text-[11px] text-amber-800 mt-0.5">
                              Sesuai kriteria AC-06-06, staf dinas hanya dapat menyetujui akun setelah pelaku UMKM mengunggah salinan izin NIB resmi OSS-RBA.
                            </p>
                          </div>
                        </div>
                      )}

                      {detailData?.documents?.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p>Belum ada berkas dokumen legalitas yang diunggah.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                          {detailData?.documents?.map((doc) => (
                            <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-navy-900 uppercase tracking-wide">
                                    {doc.jenis.replace(/_/g, ' ')}
                                  </span>
                                  <Badge status={doc.statusVerifikasi} size="sm" />
                                </div>
                                <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                                  {doc.nomor ? `No: ${doc.nomor}` : 'Nomor dokumen belum diisi'}
                                </span>
                              </div>
                              {doc.file && (
                                <a
                                  href={`/api/v1/documents/${doc.id}/file`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-navy-900 bg-navy-50 hover:bg-navy-100 rounded-lg border border-navy-200 transition"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>Buka Berkas</span>
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: PRODUK */}
                  {detailTab === 'produk' && (
                    <div className="space-y-3">
                      {detailData?.products?.length === 0 ? (
                        <div className="py-8 text-center text-slate-400">
                          <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                          <p>Pelaku UMKM belum mendaftarkan produk.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                          {detailData?.products?.map((prod) => (
                            <div key={prod.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition">
                              <div>
                                <span className="font-bold text-navy-900 block">{prod.nama}</span>
                                <span className="text-[11px] text-slate-500">
                                  Kapasitas: {prod.kapasitasBulanan} {prod.satuan}/bln &bull; Rp{prod.hargaAcuan?.toLocaleString('id-ID')}
                                </span>
                              </div>
                              <div className="text-right">
                                <Badge status={prod.statusKurasi} size="sm" />
                                {prod.gradeKurasi && (
                                  <span className="ml-1 text-[11px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Grade {prod.gradeKurasi}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Panel Tindakan Persetujuan Akun Dinas (AC-06-06, AC-06-07) */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1.5">
                  Tindakan Verifikator Dinas:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800 text-xs select-none">
                    <input
                      type="radio"
                      name="keputusan"
                      value="setuju"
                      checked={keputusan === 'setuju'}
                      onChange={() => setKeputusan('setuju')}
                    />
                    <span>Setujui Akun (Aktifkan)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-800 text-xs select-none">
                    <input
                      type="radio"
                      name="keputusan"
                      value="tolak"
                      checked={keputusan === 'tolak'}
                      onChange={() => setKeputusan('tolak')}
                    />
                    <span>Tolak Pengajuan (Minta Revisi)</span>
                  </label>
                </div>
              </div>

              <div>
                <textarea
                  rows={2}
                  placeholder={
                    keputusan === 'tolak'
                      ? 'Wajib: Berikan catatan alasan penolakan agar UMKM dapat memperbaiki...'
                      : 'Catatan opsional untuk persetujuan akun...'
                  }
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  {keputusan === 'setuju' && !detailData?.documents?.some((d) => d.jenis === 'nib') && (
                    <span className="text-rose-600 font-semibold">*Dokumen NIB belum ada di sistem</span>
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => setActiveVerify(null)}>
                    Tutup
                  </Button>
                  <Button
                    variant={keputusan === 'setuju' ? 'primary' : 'danger'}
                    size="sm"
                    loading={verifying}
                    disabled={keputusan === 'setuju' && !detailData?.documents?.some((d) => d.jenis === 'nib')}
                    onClick={handleVerify}
                    className="font-bold"
                  >
                    {keputusan === 'setuju' ? 'Simpan & Aktifkan Akun' : 'Kirim Penolakan'}
                  </Button>
                </div>
              </div>
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
