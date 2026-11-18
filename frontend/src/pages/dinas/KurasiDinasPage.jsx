// ============================================================================
// [PBI-04] Antrean Kurasi & Stepper 4 Tahap Verifikasi Mutu Dinas (FR-04)
// PIC: Abdullah
// Kriteria:
// - AC-04-03 & AC-04-04: Antrean kurasi staf, filter status, tombol 'Ambil Pengajuan'
// - AC-04-05 s/d AC-04-09: Stepper 4 tahap (1 Profil, 2 Berkas, 3 Kemasan, 4 Keputusan)
// - AC-04-10 s/d AC-04-12: Rekomendasi staf (Setuju / Revisi)
// - AC-04-13 s/d AC-04-16: Keputusan Kabid (Grade A/B, SK-KUR, Lolos ke Katalog)
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  FileCheck,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Eye,
  UserCheck,
  Award,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert } from '../../components/ui/Alert.jsx';

export function KurasiDinasPage() {
  const { user } = useAuth();
  const isKabid = user?.role === 'kabid';

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeModal, setActiveModal] = useState(null); // Submission yang sedang diperiksa
  const [actionMsg, setActionMsg] = useState(null);
  const [actionErr, setActionErr] = useState(null);

  // Form State Pemeriksaan Tahap & Rekomendasi
  const [stepModal, setStepModal] = useState(1);
  const [rekomendasi, setRekomendasi] = useState('setuju');
  const [catatan, setCatatan] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('A');
  const [submitting, setSubmitting] = useState(false);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/kurasi?status=${filterStatus}`);
      setSubmissions(res.data || []);
    } catch (e) {
      setActionErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [filterStatus]);

  const handleClaim = async (id) => {
    try {
      await api.post(`/kurasi/${id}/ambil`);
      setActionMsg('Pengajuan berhasil Anda ambil untuk pemeriksaan.');
      loadSubmissions();
    } catch (e) {
      setActionErr(e.message || 'Gagal mengambil pengajuan');
    }
  };

  const handleRekomendasiStaf = async () => {
    if (!catatan && rekomendasi === 'revisi') {
      setActionErr('Catatan perbaikan wajib diisi jika memberi rekomendasi revisi');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/kurasi/${activeModal._id}/rekomendasi`, {
        hasil: rekomendasi,
        catatan,
      });
      setActionMsg('Rekomendasi berhasil diajukan ke Kepala Bidang');
      setActiveModal(null);
      loadSubmissions();
    } catch (e) {
      setActionErr(e.message || 'Gagal mengirim rekomendasi');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeputusanKabid = async () => {
    setSubmitting(true);
    try {
      await api.post(`/kurasi/${activeModal._id}/keputusan`, {
        hasil: rekomendasi,
        grade: selectedGrade,
        catatan,
      });
      setActionMsg(`Keputusan kurasi berhasil ditetapkan (Hasil: ${rekomendasi.toUpperCase()})`);
      setActiveModal(null);
      loadSubmissions();
    } catch (e) {
      setActionErr(e.message || 'Gagal menetapkan keputusan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Standardisasi Mutu Pemkab Lebak
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-1">
            {isKabid ? 'Persetujuan Kurasi & Penerbitan SK' : 'Antrean Pemeriksaan Kurasi Produk'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            SOP 4 tahap verifikasi berkas perizinan, uji organoleptik/kemasan, dan penetapan Grade A/B.
          </p>
        </div>
      </div>

      {actionMsg && <Alert type="success" onClose={() => setActionMsg(null)}>{actionMsg}</Alert>}
      {actionErr && <Alert type="error" onClose={() => setActionErr(null)}>{actionErr}</Alert>}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'menunggu_verifikasi', 'dalam_pemeriksaan', 'menunggu_approval', 'disetujui', 'perlu_revisi'].map(
          (st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition capitalize ${
                filterStatus === st
                  ? 'bg-navy-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {st.replace(/_/g, ' ')}
            </button>
          ),
        )}
      </div>

      {/* Tabel Antrean Kurasi (AC-04-03) */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-4">Kode & Tanggal</th>
                <th className="p-4">UMKM & Kecamatan</th>
                <th className="p-4">Produk Komoditas</th>
                <th className="p-4">Verifikator Staf</th>
                <th className="p-4">Status Kurasi</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">Tidak ada pengajuan pada status ini</p>
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-mono font-bold text-navy-900">
                      <div>{sub.kode}</div>
                      <span className="text-[11px] font-normal text-slate-400">
                        {new Date(sub.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-navy-900">{sub.businessId?.namaUsaha}</div>
                      <span className="text-[11px] text-slate-500">
                        Kec. {sub.businessId?.kecamatan} &bull; NIB: {sub.businessId?.nib}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-800">{sub.productId?.nama}</div>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {sub.productId?.kategori?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {sub.assignedTo?.nama ? (
                        <span className="font-semibold text-navy-900 inline-flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          {sub.assignedTo.nama}
                        </span>
                      ) : (
                        <span className="text-amber-600 italic">Belum diambil</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge status={sub.status} size="sm" />
                      {sub.keputusan?.grade && (
                        <span className="ml-1.5 px-2 py-0.5 rounded text-[11px] font-black bg-amber-500 text-navy-950">
                          Grade {sub.keputusan.grade}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {!sub.assignedTo && sub.status === 'menunggu_verifikasi' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleClaim(sub._id)}
                          className="font-bold text-xs"
                        >
                          Ambil Pengajuan
                        </Button>
                      )}

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setActiveModal(sub);
                          setStepModal(isKabid && sub.status === 'menunggu_approval' ? 4 : 1);
                          setCatatan('');
                          setRekomendasi('setuju');
                        }}
                        className="font-bold text-xs"
                      >
                        {isKabid ? 'Tinjau & Putuskan' : 'Periksa Berkas'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Stepper 4 Tahap Pemeriksaan Kurasi (AC-04-05 s/d AC-04-16) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-mono font-bold text-amber-600">
                  {activeModal.kode} &bull; Putaran ke-{activeModal.putaran}
                </span>
                <h3 className="text-lg font-bold text-navy-900 mt-0.5">
                  Verifikasi Mutu: {activeModal.productId?.nama}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeModal.businessId?.namaUsaha} &bull; Kec. {activeModal.businessId?.kecamatan}
                </p>
              </div>
              <Badge status={activeModal.status} size="sm" />
            </div>

            {/* Stepper Indikator 4 Tahap (AC-04-05) */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold">
              <button
                onClick={() => setStepModal(1)}
                className={`p-2 rounded-lg border transition ${
                  stepModal === 1
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                1. Profil & NIB
              </button>
              <button
                onClick={() => setStepModal(2)}
                className={`p-2 rounded-lg border transition ${
                  stepModal === 2
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                2. Berkas Izin
              </button>
              <button
                onClick={() => setStepModal(3)}
                className={`p-2 rounded-lg border transition ${
                  stepModal === 3
                    ? 'bg-navy-900 text-white border-navy-900'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                3. Mutu & Label
              </button>
              <button
                onClick={() => setStepModal(4)}
                className={`p-2 rounded-lg border transition ${
                  stepModal === 4
                    ? 'bg-amber-500 text-navy-950 border-amber-500 font-extrabold'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                4. Keputusan
              </button>
            </div>

            {/* KONTEN TAHAP 1 */}
            {stepModal === 1 && (
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-xs sm:text-sm">
                <h4 className="font-bold text-navy-900 text-sm">Tahap 1: Verifikasi Profil Usaha & NIB</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Nama Usaha:</span>
                    <span className="font-bold text-navy-900">{activeModal.businessId?.namaUsaha}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">13-digit NIB:</span>
                    <span className="font-mono font-bold text-navy-900">{activeModal.businessId?.nib}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Sentra Kecamatan:</span>
                    <span className="font-bold text-navy-900">{activeModal.businessId?.kecamatan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">WhatsApp Usaha:</span>
                    <span className="font-bold text-navy-900">{activeModal.businessId?.waUsaha}</span>
                  </div>
                </div>
                <div className="pt-2 text-right">
                  <Button variant="primary" size="sm" onClick={() => setStepModal(2)}>
                    Lanjut ke Tahap 2 &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* KONTEN TAHAP 2 */}
            {stepModal === 2 && (
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-xs sm:text-sm">
                <h4 className="font-bold text-navy-900 text-sm">Tahap 2: Pemeriksaan Kelengkapan Izin</h4>
                <p className="text-xs text-slate-500">
                  Kategori: <strong>{activeModal.productId?.kategori?.replace(/_/g, ' ')}</strong>
                </p>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                    <span className="font-semibold text-slate-800">1. Salinan Izin NIB OSS-RBA</span>
                    <Badge status="valid" size="sm" />
                  </div>
                  {activeModal.productId?.kategori === 'olahan_pangan' && (
                    <>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">2. Sertifikat SPP-IRT</span>
                        <Badge status="valid" size="sm" />
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">3. Sertifikat Halal BPJPH</span>
                        <Badge status="valid" size="sm" />
                      </div>
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                        <span className="font-semibold text-slate-800">4. Uji Umur Simpan / Laboratorium</span>
                        <Badge status="valid" size="sm" />
                      </div>
                    </>
                  )}
                </div>
                <div className="pt-2 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setStepModal(1)}>
                    &larr; Kembali
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setStepModal(3)}>
                    Lanjut ke Tahap 3 &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* KONTEN TAHAP 3 */}
            {stepModal === 3 && (
              <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-xs sm:text-sm">
                <h4 className="font-bold text-navy-900 text-sm">Tahap 3: Umur Simpan, Kemasan & Label Mutu</h4>
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-800">Kesesuaian Label & Kemasan</span>
                    <span className="text-emerald-700 font-bold">Memenuhi Standar</span>
                  </div>
                  <p className="text-slate-500">
                    Foto produk, logo, komposisi, tanggal kedaluwarsa, dan identitas UMKM jelas terbaca.
                  </p>
                </div>
                <div className="pt-2 flex justify-between">
                  <Button variant="outline" size="sm" onClick={() => setStepModal(2)}>
                    &larr; Kembali
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => setStepModal(4)}>
                    Lanjut ke Keputusan &rarr;
                  </Button>
                </div>
              </div>
            )}

            {/* KONTEN TAHAP 4: KEPUTUSAN */}
            {stepModal === 4 && (
              <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 space-y-4 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600" />
                  <h4 className="font-bold text-navy-900 text-sm">
                    {isKabid ? 'Keputusan Akhir Kepala Bidang (SK Kurasi)' : 'Rekomendasi Staf Verifikator'}
                  </h4>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-navy-900 mb-1">
                      {isKabid ? 'Keputusan Kepala Bidang:' : 'Hasil Rekomendasi Staf:'}
                    </label>
                    <div className="flex gap-3">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-800">
                        <input
                          type="radio"
                          name="rekomendasi"
                          value="setuju"
                          checked={rekomendasi === 'setuju'}
                          onChange={() => setRekomendasi('setuju')}
                        />
                        <span>Setujui (Lolos Kurasi)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-800">
                        <input
                          type="radio"
                          name="rekomendasi"
                          value="revisi"
                          checked={rekomendasi === 'revisi'}
                          onChange={() => setRekomendasi('revisi')}
                        />
                        <span>Kembalikan untuk Revisi</span>
                      </label>
                    </div>
                  </div>

                  {isKabid && rekomendasi === 'setuju' && (
                    <div>
                      <label className="block text-xs font-bold text-navy-900 mb-1">
                        Grade Kurasi yang Ditetapkan:
                      </label>
                      <select
                        value={selectedGrade}
                        onChange={(e) => setSelectedGrade(e.target.value)}
                        className="text-xs font-bold py-2 px-3 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="A">Grade A (Siap Ritel Modern & Ekspor)</option>
                        <option value="B">Grade B (Layak Katalog & Plaza Lebak)</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-navy-900 mb-1">
                      Catatan Pertimbangan / Revisi:
                    </label>
                    <textarea
                      rows={3}
                      placeholder={
                        rekomendasi === 'revisi'
                          ? 'Sebutkan butir izin atau kemasan yang harus diperbaiki oleh UMKM...'
                          : 'Catatan rekomendasi mutlak...'
                      }
                      value={catatan}
                      onChange={(e) => setCatatan(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-between border-t border-amber-200">
                  <Button variant="outline" size="sm" onClick={() => setStepModal(3)}>
                    &larr; Kembali
                  </Button>
                  {isKabid ? (
                    <Button
                      variant={rekomendasi === 'setuju' ? 'secondary' : 'danger'}
                      size="sm"
                      loading={submitting}
                      onClick={handleKeputusanKabid}
                      className="font-extrabold"
                    >
                      {rekomendasi === 'setuju' ? 'Terbitkan SK & Lencana Kurasi' : 'Kirim Catatan Revisi'}
                    </Button>
                  ) : (
                    <Button
                      variant={rekomendasi === 'setuju' ? 'primary' : 'danger'}
                      size="sm"
                      loading={submitting}
                      onClick={handleRekomendasiStaf}
                      className="font-bold"
                    >
                      Kirim Rekomendasi ke Kabid
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2 text-right">
              <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)}>
                Tutup Jendela
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default KurasiDinasPage;
