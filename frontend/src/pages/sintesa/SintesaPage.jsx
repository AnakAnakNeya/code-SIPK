// ============================================================================
// Halaman Layanan Rumah Kemasan Sintesa (frontend/src/pages/sintesa/SintesaPage.jsx)
// [PBI-14] Layanan Kemasan Sintesa (FR-11)
// PIC: Fariz | Aktor: umkm (pengajuan), staf/kabid (antrean & desainer)
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  PackageCheck,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  FileText,
  UploadCloud,
  ChevronRight,
  Filter,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';

export function SintesaPage() {
  const { user } = useAuth();
  const isDinas = ['staf', 'kabid'].includes(user?.role);
  const isUmkm = user?.role === 'umkm';

  // State kuota
  const [quota, setQuota] = useState({ total: 100, terpakai: 0, sisa: 100 });
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // UMKM States
  const [eligibility, setEligibility] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    productId: '',
    jenisFasilitasi: 'desain_kemasan',
    kondisiKemasan: '',
    targetPasar: '',
    usulanJadwal: '',
  });
  const [submittingApply, setSubmittingApply] = useState(false);

  // Dinas States
  const [dinasRequests, setDinasRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState(null); // 'jadwal' | 'desainer' | 'selesai' | 'tolak' | 'detail'
  const [actionPayload, setActionPayload] = useState({
    jadwalFinal: '',
    desainerNama: '',
    catatanHasil: '',
    alasan: '',
  });
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    fetchQuota();
    if (isUmkm) {
      fetchEligibility();
      fetchMyRequests();
    } else {
      fetchDinasRequests();
    }
  }, [isUmkm, statusFilter]);

  const fetchQuota = async () => {
    try {
      setLoading(true);
      const res = await api.get('/sintesa/kuota');
      if (res.data) setQuota(res.data);
    } catch (err) {
      console.warn('Gagal memuat kuota Sintesa:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibility = async () => {
    try {
      const res = await api.get('/sintesa/syarat');
      setEligibility(res.data);
    } catch (err) {
      console.warn('Gagal memuat syarat Sintesa:', err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await api.get('/sintesa/mine');
      setMyRequests(res.data?.items || res.data || []);
    } catch (err) {
      console.warn('Gagal memuat pengajuan Sintesa saya:', err);
    }
  };

  const fetchDinasRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/sintesa', { params });
      setDinasRequests(res.data?.items || res.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat antrean Sintesa');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingApply(true);
      await api.post('/sintesa', applyForm);
      setSuccessMsg('Pengajuan fasilitasi Rumah Kemasan Sintesa berhasil dikirim!');
      setIsApplyOpen(false);
      setApplyForm({
        productId: '',
        jenisFasilitasi: 'desain_kemasan',
        kondisiKemasan: '',
        targetPasar: '',
        usulanJadwal: '',
      });
      fetchMyRequests();
      fetchEligibility();
      fetchQuota();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Gagal mengajukan layanan Sintesa');
    } finally {
      setSubmittingApply(false);
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Batalkan pengajuan kemasan Sintesa ini?')) return;
    try {
      await api.post(`/sintesa/${id}/batalkan`);
      setSuccessMsg('Pengajuan kemasan berhasil dibatalkan.');
      fetchMyRequests();
      fetchQuota();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal membatalkan pengajuan');
    }
  };

  const handleDinasAction = async (e) => {
    e.preventDefault();
    if (!actionTarget || !actionType) return;

    try {
      setActionSubmitting(true);
      if (actionType === 'jadwal') {
        await api.post(`/sintesa/${actionTarget._id}/jadwal`, {
          jadwalFinal: actionPayload.jadwalFinal,
        });
        setSuccessMsg('Jadwal konsultasi tatap muka berhasil ditetapkan.');
      } else if (actionType === 'desainer') {
        await api.post(`/sintesa/${actionTarget._id}/desainer`, {
          desainerNama: actionPayload.desainerNama,
        });
        setSuccessMsg('Desainer ditugaskan & 1 paket kuota subsidi resmi dipotong secara atomik.');
      } else if (actionType === 'selesai') {
        await api.post(`/sintesa/${actionTarget._id}/selesai`, {
          catatanHasil: actionPayload.catatanHasil,
        });
        setSuccessMsg('Layanan kemasan ditandai selesai (ACC Cetak).');
      } else if (actionType === 'tolak') {
        await api.post(`/sintesa/${actionTarget._id}/tolak`, {
          alasan: actionPayload.alasan,
        });
        setSuccessMsg('Pengajuan kemasan ditolak.');
      }

      setActionTarget(null);
      setActionType(null);
      setActionPayload({ jadwalFinal: '', desainerNama: '', catatanHasil: '', alasan: '' });
      fetchDinasRequests();
      fetchQuota();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Gagal memproses aksi');
    } finally {
      setActionSubmitting(false);
    }
  };

  const sisaQuota = quota.total - (quota.terpakai || 0);
  const quotaPct = Math.round(((quota.terpakai || 0) / (quota.total || 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Rumah Kemasan Sintesa Lebak
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-1">
            {isDinas ? 'Pengelolaan Antrean Desain & Subsidi Kemasan' : 'Fasilitasi Desain & Subsidi Kemasan'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Layanan pendampingan desain label/kemasan komoditas unggulan dan subsidi cetak gratis Diskop UKM Lebak.
          </p>
        </div>

        {isUmkm && (
          <Button
            variant="primary"
            onClick={() => setIsApplyOpen(true)}
            disabled={!eligibility?.eligible}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ajukan Desain Kemasan</span>
          </Button>
        )}
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Hero Kartu Kuota Subsidi Tahun Berjalan */}
      <Card className="bg-gradient-to-r from-navy-900 to-slate-800 text-white p-6 shadow-md border-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
              <PackageCheck className="w-3.5 h-3.5" /> Kuota Subsidi Cetak Tahun 2026
            </span>
            <h2 className="text-2xl font-extrabold text-white">
              Tersisa {sisaQuota} dari {quota.total} Paket Subsidi
            </h2>
            <p className="text-xs text-slate-300 max-w-xl">
              Fasilitasi cetak kemasan gratis diberikan kepada UMKM dengan produk terkurasi dinas (maksimal 1 komoditas per unit usaha per tahun berjalan).
            </p>
          </div>

          <div className="w-full md:w-64 bg-white/10 p-4 rounded-xl border border-white/10">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-1.5">
              <span>Alokasi Terpakai</span>
              <span>{quota.terpakai} paket ({quotaPct}%)</span>
            </div>
            <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                style={{ width: `${quotaPct}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* ====================================================================== */}
      {/* TAMPILAN KHUSUS PELAKU UMKM */}
      {/* ====================================================================== */}
      {isUmkm && (
        <div className="space-y-6">
          {/* Eligibility Alert Card */}
          {eligibility && !eligibility.eligible && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Persyaratan Belum Lengkap untuk Mengajukan Kemasan Sintesa:
              </p>
              <ul className="list-disc pl-6 space-y-0.5 text-slate-700">
                {eligibility.reasons?.map((r, idx) => (
                  <li key={idx}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Daftar Pengajuan Saya */}
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-navy-900">
              Riwayat Pengajuan Desain Kemasan Saya
            </h3>

            {myRequests.length === 0 ? (
              <Card className="p-8 text-center text-slate-400 text-xs">
                Anda belum pernah mengajukan fasilitas desain kemasan Rumah Kemasan Sintesa.
              </Card>
            ) : (
              <div className="space-y-4">
                {myRequests.map((req) => {
                  const canCancel = ['diajukan', 'dijadwalkan'].includes(req.status);

                  return (
                    <Card key={req._id} className="p-5 overflow-hidden">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-navy-900 bg-slate-100 px-2 py-0.5 rounded">
                              {req.kode || 'SIN-2026-XXX'}
                            </span>
                            <Badge status={req.status} />
                          </div>
                          <h4 className="text-base font-extrabold text-navy-900 mt-2">
                            {req.productId?.nama || 'Produk Komoditas'}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Fasilitasi:{' '}
                            <strong className="text-slate-700 uppercase">
                              {req.jenisFasilitasi?.replace('_', ' ')}
                            </strong>{' '}
                            &bull; Target Pasar: {req.targetPasar}
                          </p>
                        </div>

                        {canCancel && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 self-start"
                            onClick={() => handleCancelRequest(req._id)}
                          >
                            Batalkan Pengajuan
                          </Button>
                        )}
                      </div>

                      {/* Timeline Vertikal Progres */}
                      <div className="pt-4">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                          Alur Pendampingan Kemasan:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                          {/* Tahap 1 */}
                          <div className={`p-3 rounded-xl border ${
                            ['diajukan', 'dijadwalkan', 'desain_dikerjakan', 'selesai'].includes(req.status)
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>1. Pengajuan</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              Usulan: {new Date(req.usulanJadwal).toLocaleDateString('id-ID')}
                            </p>
                          </div>

                          {/* Tahap 2 */}
                          <div className={`p-3 rounded-xl border ${
                            ['dijadwalkan', 'desain_dikerjakan', 'selesai'].includes(req.status)
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              {['dijadwalkan', 'desain_dikerjakan', 'selesai'].includes(req.status) ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span>2. Penjadwalan</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {req.jadwalFinal
                                ? `Tatap muka: ${new Date(req.jadwalFinal).toLocaleDateString('id-ID')}`
                                : 'Menunggu staf dinas'}
                            </p>
                          </div>

                          {/* Tahap 3 */}
                          <div className={`p-3 rounded-xl border ${
                            ['desain_dikerjakan', 'selesai'].includes(req.status)
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              {['desain_dikerjakan', 'selesai'].includes(req.status) ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span>3. Desain Dikerjakan</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {req.desainerNama ? `Desainer: ${req.desainerNama}` : 'Alokasi desainer'}
                            </p>
                          </div>

                          {/* Tahap 4 */}
                          <div className={`p-3 rounded-xl border ${
                            req.status === 'selesai'
                              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                              : 'bg-slate-50 border-slate-200 text-slate-400'
                          }`}>
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              {req.status === 'selesai' ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              ) : (
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                              )}
                              <span>4. Selesai (ACC Cetak)</span>
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {req.status === 'selesai' ? 'Siap produksi kemasan' : 'Persetujuan akhir'}
                            </p>
                          </div>
                        </div>

                        {req.alasanTolak && (
                          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                            <strong>Alasan Penolakan:</strong> {req.alasanTolak}
                          </div>
                        )}
                        {req.catatanHasil && (
                          <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs">
                            <strong>Catatan Hasil:</strong> {req.catatanHasil}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAMPILAN KHUSUS STAF / KABID DINAS */}
      {/* ====================================================================== */}
      {isDinas && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold">
              <Filter className="w-4 h-4" />
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
              >
                <option value="">Semua Status Antrean</option>
                <option value="diajukan">Diajukan (Perlu Jadwal)</option>
                <option value="dijadwalkan">Dijadwalkan (Perlu Desainer)</option>
                <option value="desain_dikerjakan">Sedang Dikerjakan</option>
                <option value="selesai">Selesai</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>

            <Button variant="outline" size="sm" onClick={fetchDinasRequests} className="text-xs">
              Segarkan Antrean
            </Button>
          </div>

          {/* Tabel Pengajuan Sintesa */}
          <Card>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Memuat data antrean Rumah Kemasan Sintesa...
                </div>
              ) : dinasRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Tidak ada pengajuan dengan filter ini.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">No. Pengajuan & UMKM</th>
                        <th className="px-4 py-3">Produk Komoditas</th>
                        <th className="px-4 py-3">Jenis Fasilitasi</th>
                        <th className="px-4 py-3">Jadwal & Desainer</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dinasRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-navy-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                              {req.kode || 'SIN-2026-XXX'}
                            </span>
                            <p className="font-bold text-navy-900 mt-1">
                              {req.businessId?.namaUsaha || 'UMKM'}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Kecamatan {req.businessId?.kecamatan || '-'}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-semibold text-slate-800">
                              {req.productId?.nama || 'Produk'}
                            </p>
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              Terkurasi (Grade {req.productId?.grade || 'B'})
                            </span>
                          </td>
                          <td className="px-4 py-4 uppercase font-semibold text-slate-700 text-[11px]">
                            {req.jenisFasilitasi?.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-4">
                            {req.jadwalFinal ? (
                              <p className="font-semibold text-slate-800">
                                {new Date(req.jadwalFinal).toLocaleDateString('id-ID')}
                              </p>
                            ) : (
                              <p className="text-amber-700 font-medium">
                                Usulan: {new Date(req.usulanJadwal).toLocaleDateString('id-ID')}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400">
                              {req.desainerNama ? `Desainer: ${req.desainerNama}` : 'Belum ada desainer'}
                            </p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge status={req.status} />
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {req.status === 'diajukan' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="text-[11px] px-2.5 py-1"
                                  onClick={() => {
                                    setActionTarget(req);
                                    setActionType('jadwal');
                                    setActionPayload({
                                      ...actionPayload,
                                      jadwalFinal: new Date(req.usulanJadwal)
                                        .toISOString()
                                        .split('T')[0],
                                    });
                                  }}
                                >
                                  Atur Jadwal
                                </Button>
                              )}

                              {req.status === 'dijadwalkan' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="text-[11px] px-2.5 py-1 bg-purple-600 hover:bg-purple-700"
                                  onClick={() => {
                                    setActionTarget(req);
                                    setActionType('desainer');
                                  }}
                                >
                                  Tetapkan Desainer
                                </Button>
                              )}

                              {req.status === 'desain_dikerjakan' && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="text-[11px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => {
                                    setActionTarget(req);
                                    setActionType('selesai');
                                  }}
                                >
                                  Tandai Selesai
                                </Button>
                              )}

                              {['diajukan', 'dijadwalkan'].includes(req.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[11px] px-2.5 py-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                                  onClick={() => {
                                    setActionTarget(req);
                                    setActionType('tolak');
                                  }}
                                >
                                  Tolak
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL AJUKAN KEMASAN (UMKM) */}
      {/* ====================================================================== */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Formulir Fasilitasi Desain & Subsidi Kemasan Sintesa"
        size="lg"
      >
        <form onSubmit={handleApplySubmit} className="space-y-4">
          <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Ketentuan Fasilitasi Gratis Sintesa 2026:
            </p>
            <p>
              Setiap UMKM berhak atas fasilitasi desain kemasan dan subsidi cetak gratis untuk 1
              produk unggulan per tahun anggaran.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pilih Produk Terkurasi <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={applyForm.productId}
              onChange={(e) => setApplyForm({ ...applyForm, productId: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-navy-900"
            >
              <option value="">-- Pilih Produk Terkurasi Anda --</option>
              {eligibility?.eligibleProducts?.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.nama} (Grade {p.grade || 'B'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Fasilitasi <span className="text-rose-500">*</span>
              </label>
              <select
                value={applyForm.jenisFasilitasi}
                onChange={(e) => setApplyForm({ ...applyForm, jenisFasilitasi: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-navy-900"
              >
                <option value="desain_kemasan">Desain Kemasan (Bentuk & Grafis)</option>
                <option value="desain_label">Desain Label Stiker</option>
                <option value="keduanya">Keduanya (Kemasan & Label)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Usulan Tanggal Konsultasi Tatap Muka <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={applyForm.usulanJadwal}
                onChange={(e) => setApplyForm({ ...applyForm, usulanJadwal: e.target.value })}
              />
              <span className="text-[10px] text-slate-400">Minimal 3 hari kerja (Senin - Jumat)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Target Pasar & Rencana Distribusi <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="Contoh: Ritel Modern Alfamart / Pasar Oleh-oleh Jabodetabek"
              value={applyForm.targetPasar}
              onChange={(e) => setApplyForm({ ...applyForm, targetPasar: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deskripsi Kondisi Kemasan Saat Ini <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan kemasan yang sedang Anda pakai saat ini, keluhan atau tujuan peningkatan (mis. umur simpan, daya tarik visual)..."
              value={applyForm.kondisiKemasan}
              onChange={(e) => setApplyForm({ ...applyForm, kondisiKemasan: e.target.value })}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-navy-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApplyOpen(false)}
              disabled={submittingApply}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submittingApply}>
              {submittingApply ? 'Mengirim Pengajuan...' : 'Kirim Pengajuan Sintesa'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL AKSI DINAS (JADWAL, DESAINER, SELESAI, TOLAK) */}
      {/* ====================================================================== */}
      <Modal
        isOpen={!!actionTarget && !!actionType}
        onClose={() => {
          setActionTarget(null);
          setActionType(null);
        }}
        title={
          actionType === 'jadwal'
            ? 'Atur Jadwal Konsultasi Tatap Muka'
            : actionType === 'desainer'
            ? 'Tetapkan Desainer & Potong Kuota Subsidi'
            : actionType === 'selesai'
            ? 'Tandai Selesai (ACC Cetak)'
            : 'Tolak Pengajuan Sintesa'
        }
        size="md"
      >
        <form onSubmit={handleDinasAction} className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
            <p>
              Pengajuan: <strong>{actionTarget?.kode}</strong> &bull; UMKM:{' '}
              <strong>{actionTarget?.businessId?.namaUsaha}</strong>
            </p>
            <p>
              Produk: <strong>{actionTarget?.productId?.nama}</strong>
            </p>
          </div>

          {actionType === 'jadwal' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jadwal Final Konsultasi di Rumah Kemasan <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={actionPayload.jadwalFinal}
                onChange={(e) =>
                  setActionPayload({ ...actionPayload, jadwalFinal: e.target.value })
                }
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Usulan UMKM: {new Date(actionTarget?.usulanJadwal).toLocaleDateString('id-ID')}
              </p>
            </div>
          )}

          {actionType === 'desainer' && (
            <div className="space-y-3">
              <div className="p-3 bg-purple-50 border border-purple-200 text-purple-900 rounded-lg text-xs">
                <strong>Catatan Kuota Atomik:</strong> Menetapkan desainer akan memotong{' '}
                <strong>1 paket kuota subsidi cetak</strong> dari sisa kuota tahun 2026.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Desainer Grafis / Tenaga Teknis Sintesa <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Contoh: Rian Pratama (Desainer Rumah Kemasan PLUT)"
                  value={actionPayload.desainerNama}
                  onChange={(e) =>
                    setActionPayload({ ...actionPayload, desainerNama: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {actionType === 'selesai' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Hasil Pendampingan & Spesifikasi Cetak
              </label>
              <textarea
                rows={3}
                placeholder="Contoh: Desain kemasan pouch zipper 250gr disetujui UMKM. Siap masuk mesin cetak digital."
                value={actionPayload.catatanHasil}
                onChange={(e) =>
                  setActionPayload({ ...actionPayload, catatanHasil: e.target.value })
                }
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-navy-900"
              />
            </div>
          )}

          {actionType === 'tolak' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Penolakan <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Jelaskan alasan penolakan agar pelaku UMKM dapat memperbaiki..."
                value={actionPayload.alasan}
                onChange={(e) => setActionPayload({ ...actionPayload, alasan: e.target.value })}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-navy-900"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setActionTarget(null);
                setActionType(null);
              }}
              disabled={actionSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className={actionType === 'tolak' ? 'bg-rose-600' : ''}
              disabled={actionSubmitting}
            >
              {actionSubmitting ? 'Memproses...' : 'Simpan & Perbarui Status'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default SintesaPage;
