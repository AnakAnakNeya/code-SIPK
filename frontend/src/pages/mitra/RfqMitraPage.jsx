// ============================================================================
// [PBI-07] Halaman Permintaan Pesanan (RFQ) Mitra (frontend/src/pages/mitra/RfqMitraPage.jsx)
// PIC: Naila | Formulir Draf, Pengajuan Verifikasi, & Monitoring Agregasi Kuota
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  FileText,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  Trash2,
  Edit3,
  ExternalLink,
  Building2,
  Calendar,
  MapPin,
  TrendingUp,
  XCircle,
  FileCheck,
} from 'lucide-react';
import api from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PoViewModal } from '../shared/po/PoViewModal.jsx';

export function RfqMitraPage() {
  const [rfqs, setRfqs] = useState([]);
  const [komoditasList, setKomoditasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [modalDetailRfq, setModalDetailRfq] = useState(null);
  const [activePoRfqId, setActivePoRfqId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [selectedKomoditas, setSelectedKomoditas] = useState('');
  const [kuotaTotal, setKuotaTotal] = useState(50);
  const [tenggat, setTenggat] = useState('');
  const [lokasiKirim, setLokasiKirim] = useState('');
  const [catatanMutu, setCatatanMutu] = useState('');

  const fetchRfqs = async () => {
    try {
      const res = await api.get('/rfq/mine');
      setRfqs(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKomoditas = async () => {
    try {
      const res = await api.get('/rfq/komoditas');
      setKomoditasList(res.data.data || []);
      if (res.data.data?.length > 0) {
        setSelectedKomoditas(res.data.data[0].komoditasSlug);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.all([fetchRfqs(), fetchKomoditas()]).finally(() => setLoading(false));

    // Default tenggat = 14 hari ke depan
    const defaultDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    setTenggat(defaultDate.toISOString().split('T')[0]);
  }, []);

  const activeKomoditasInfo = komoditasList.find((k) => k.komoditasSlug === selectedKomoditas);

  const handleSaveDraftOrSubmit = async (isSubmit) => {
    setErrorMsg('');
    setSubmitting(true);
    try {
      // 1. Simpan Draf
      const res = await api.post('/rfq', {
        komoditasSlug: selectedKomoditas,
        kuotaTotal: Number(kuotaTotal),
        tenggat: new Date(tenggat).toISOString(),
        lokasiKirim,
        catatanMutu,
      });

      const newId = res.data.data._id;

      // 2. Jika tombol "Ajukan Langsung", panggil endpoint ajukan
      if (isSubmit) {
        await api.post(`/rfq/${newId}/ajukan`);
      }

      setModalCreateOpen(false);
      await fetchRfqs();
      alert(isSubmit ? 'RFQ berhasil diajukan untuk verifikasi dinas!' : 'Draf RFQ berhasil disimpan!');
    } catch (err) {
      setErrorMsg(err.response?.data?.error?.message || 'Gagal menyimpan RFQ. Pastikan semua field valid.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAjukan = async (rfqId) => {
    if (!confirm('Ajukan RFQ ini untuk diverifikasi oleh Dinas Koperasi & UKM?')) return;
    try {
      await api.post(`/rfq/${rfqId}/ajukan`);
      await fetchRfqs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal mengajukan RFQ');
    }
  };

  const handleBatalkan = async (rfqId) => {
    const alasan = prompt('Masukkan alasan pembatalan RFQ:');
    if (!alasan) return;
    try {
      await api.post(`/rfq/${rfqId}/batalkan`, { alasan });
      await fetchRfqs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal membatalkan RFQ');
    }
  };

  const handleDeleteDraft = async (rfqId) => {
    if (!confirm('Hapus draf RFQ ini secara permanen?')) return;
    try {
      await api.delete(`/rfq/${rfqId}`);
      await fetchRfqs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal menghapus draf');
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      draf: { label: 'Draf', variant: 'neutral' },
      menunggu_verifikasi: { label: 'Menunggu Verifikasi Dinas', variant: 'warning' },
      ditolak: { label: 'Perlu Revisi / Ditolak', variant: 'danger' },
      terbuka: { label: 'Terbuka (Agregasi Kuota)', variant: 'info' },
      proses_verifikasi: { label: 'Kuota 100% (Verifikasi Akhir)', variant: 'warning' },
      terpenuhi: { label: 'Terpenuhi (PO Terbit)', variant: 'success' },
      kedaluwarsa: { label: 'Kedaluwarsa', variant: 'neutral' },
      dibatalkan: { label: 'Dibatalkan', variant: 'danger' },
    };
    const conf = map[status] || { label: status, variant: 'neutral' };
    return <Badge variant={conf.variant}>{conf.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
            <FileText className="w-4 h-4" />
            <span>Permintaan Penawaran Bersama (Request for Quotation)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen RFQ Mitra Bisnis</h1>
          <p className="text-sm text-slate-300">
            Terbitkan permintaan pesanan skala besar untuk komoditas terkurasi Lebak tanpa mencari UMKM satu per satu.
          </p>
        </div>
        <Button
          onClick={() => setModalCreateOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold shrink-0 shadow-lg"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Buat RFQ Baru
        </Button>
      </div>

      {/* Tabel Daftar RFQ Milik Mitra */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 py-4 px-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Riwayat & Daftar RFQ Anda</h2>
            <p className="text-xs text-slate-500">Pantau progres pengisian kuota dan status verifikasi dinas</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Total: {rfqs.length} Dokumen
          </span>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Memuat data RFQ...</div>
          ) : rfqs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada Permintaan Pesanan</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Mulai buat RFQ pertama Anda untuk memesan komoditas terkurasi (tenun Baduy, gula aren, emping melinjo).
              </p>
              <Button size="sm" onClick={() => setModalCreateOpen(true)} className="bg-navy-900 text-white">
                Buat RFQ Sekarang
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Kode & Komoditas</th>
                    <th className="py-3 px-4">Target Volume</th>
                    <th className="py-3 px-4 w-48">Progres Kuota</th>
                    <th className="py-3 px-4">Tenggat Waktu</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rfqs.map((r) => {
                    const pct = Math.round((r.kuotaTerkumpul / r.kuotaTotal) * 100);
                    return (
                      <tr key={r._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-navy-950 block">{r.kode}</span>
                          <span className="text-slate-600">{r.komoditasNama}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {r.kuotaTotal.toLocaleString('id-ID')} {r.satuan}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            @ Rp {r.hargaAcuan.toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[11px] font-medium text-slate-600">
                              <span>{r.kuotaTerkumpul} / {r.kuotaTotal} {r.satuan}</span>
                              <span className="font-bold text-navy-900">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  pct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(r.tenggat).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4">{getStatusBadge(r.status)}</td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {r.status === 'draf' && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleAjukan(r._id)}>
                                <Send className="w-3.5 h-3.5 mr-1 text-blue-600" />
                                Ajukan
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteDraft(r._id)}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </>
                          )}

                          {['menunggu_verifikasi', 'terbuka'].includes(r.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBatalkan(r._id)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1" />
                              Batalkan
                            </Button>
                          )}

                          {r.status === 'terpenuhi' && (
                            <Button
                              size="sm"
                              onClick={() => setActivePoRfqId(r._id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              <FileCheck className="w-3.5 h-3.5 mr-1" />
                              Lihat PO (.PDF)
                            </Button>
                          )}

                          <Button size="sm" variant="ghost" onClick={() => setModalDetailRfq(r)}>
                            Detail
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Formulir Pembuatan RFQ Baru (AC-07-01 s/d AC-07-08) */}
      <Modal
        isOpen={modalCreateOpen}
        onClose={() => setModalCreateOpen(false)}
        title="Formulir Permintaan Pesanan Baru (RFQ)"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-slate-400">Tenggat min. 7 hari dari hari ini</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onClick={() => handleSaveDraftOrSubmit(false)}
              >
                Simpan Draf
              </Button>
              <Button
                size="sm"
                disabled={submitting}
                onClick={() => handleSaveDraftOrSubmit(true)}
                className="bg-navy-900 hover:bg-navy-800 text-white"
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Ajukan untuk Verifikasi
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-900 rounded-lg border border-red-200">
              {errorMsg}
            </div>
          )}

          {/* Pilihan Komoditas */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Pilih Komoditas Unggulan Terkurasi:
            </label>
            <select
              value={selectedKomoditas}
              onChange={(e) => setSelectedKomoditas(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
            >
              {komoditasList.map((k) => (
                <option key={k.komoditasSlug} value={k.komoditasSlug}>
                  {k.komoditasNama} ({k.jumlahUmkm} UMKM Binaan, Kapasitas: {k.totalKapasitasBulanan} {k.satuan}/bln)
                </option>
              ))}
            </select>
          </div>

          {/* Kartu Ringkasan Harga Acuan & Kecukupan Kapasitas (AC-07-04 & AC-07-05) */}
          {activeKomoditasInfo && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Harga Acuan Resmi Dinas
                </span>
                <span className="text-base font-extrabold text-navy-950">
                  Rp {activeKomoditasInfo.hargaAcuan?.toLocaleString('id-ID')}
                </span>
                <span className="text-[10px] text-slate-500"> / {activeKomoditasInfo.satuan}</span>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-medium">
                  Sumber: {activeKomoditasInfo.hargaAcuanSumber === 'referensi_dinas' ? 'SK Dinas Resmi' : 'Rata-rata Produk'}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block uppercase font-bold">
                  Kapasitas Agregat Binaan
                </span>
                <span className="text-base font-extrabold text-slate-800">
                  {activeKomoditasInfo.totalKapasitasBulanan} {activeKomoditasInfo.satuan}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  dari {activeKomoditasInfo.jumlahUmkm} pelaku usaha aktif
                </span>
                {Number(kuotaTotal) > activeKomoditasInfo.totalKapasitasBulanan ? (
                  <span className="text-[10px] text-amber-700 font-semibold block mt-0.5">
                    Catatan: Volume melebihi kapasitas bulanan (akan membutuhkan waktu bertahap).
                  </span>
                ) : (
                  <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                    Kapasitas mencukupi untuk pemenuhan 1 bulan.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Volume Total & Tenggat Waktu */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Volume Total ({activeKomoditasInfo?.satuan || 'satuan'}):
              </label>
              <input
                type="number"
                min="10"
                max="100000"
                value={kuotaTotal}
                onChange={(e) => setKuotaTotal(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Tenggat Pengisian Kuota:
              </label>
              <input
                type="date"
                value={tenggat}
                onChange={(e) => setTenggat(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Lokasi Kirim */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Alamat Lengkap / Lokasi Penyerahan:
            </label>
            <input
              type="text"
              placeholder="Contoh: Gudang Logistik Hotel Banten, Jl. Raya Rangkasbitung No. 12"
              value={lokasiKirim}
              onChange={(e) => setLokasiKirim(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Catatan Mutu */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Spesifikasi Mutu & Kemasan (Opsional):
            </label>
            <textarea
              rows="3"
              placeholder="Contoh: Benang katun pewarna alami, dikemas plastik tebal 0.5 mm dengan label asal Lebak."
              value={catatanMutu}
              onChange={(e) => setCatatanMutu(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </Modal>

      {/* Modal Detail RFQ */}
      {modalDetailRfq && (
        <Modal
          isOpen={true}
          onClose={() => setModalDetailRfq(null)}
          title={`Detail ${modalDetailRfq.kode} - ${modalDetailRfq.komoditasNama}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl">
              <div>
                <span className="text-slate-400 block text-[10px]">Status Saat Ini</span>
                <div className="mt-1">{getStatusBadge(modalDetailRfq.status)}</div>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Target Nilai Transaksi</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  Rp {(modalDetailRfq.kuotaTotal * modalDetailRfq.hargaAcuan).toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Lokasi Penyerahan:</span>
              <p className="p-2.5 bg-white border border-slate-200 rounded-lg">{modalDetailRfq.lokasiKirim}</p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-700">Catatan Mutu:</span>
              <p className="p-2.5 bg-white border border-slate-200 rounded-lg">
                {modalDetailRfq.catatanMutu || 'Tidak ada catatan mutu khusus'}
              </p>
            </div>

            {modalDetailRfq.status === 'terpenuhi' && (
              <Button
                onClick={() => {
                  setModalDetailRfq(null);
                  setActivePoRfqId(modalDetailRfq._id);
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Lihat & Cetak Dokumen Purchase Order (PO Summary)
              </Button>
            )}
          </div>
        </Modal>
      )}

      {/* Modal PO View */}
      {activePoRfqId && (
        <PoViewModal
          isOpen={true}
          onClose={() => setActivePoRfqId(null)}
          rfqId={activePoRfqId}
        />
      )}
    </div>
  );
}

export default RfqMitraPage;
