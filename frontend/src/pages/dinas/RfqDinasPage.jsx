// ============================================================================
// [PBI-08 & PBI-11] Verifikasi RFQ & Penerbitan PO Dinas (frontend/src/pages/dinas/RfqDinasPage.jsx)
// PIC: Abdullah | Verifikasi Permintaan Mitra, Penetapan Harga Acuan, & Terbit PO
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  FileCheck,
  TrendingUp,
  Tag,
  Clock,
  Layers,
  Send,
  Building2,
  AlertTriangle,
  Award,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PoViewModal } from '../shared/po/PoViewModal.jsx';

export function RfqDinasPage() {
  const [activeTab, setActiveTab] = useState('menunggu'); // 'menunggu' | 'kuota_penuh' | 'harga_acuan'
  const [rfqs, setRfqs] = useState([]);
  const [referencePrices, setReferencePrices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Actions
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [actionType, setActionType] = useState(null); // 'setujui' | 'tolak' | 'terbitkan_po'
  const [hargaPenyesuaian, setHargaPenyesuaian] = useState('');
  const [alasanHarga, setAlasanHarga] = useState('');
  const [catatanTolak, setCatatanTolak] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activePoRfqId, setActivePoRfqId] = useState(null);

  // Form Tambah/Ubah Harga Acuan
  const [modalRefPriceOpen, setModalRefPriceOpen] = useState(false);
  const [refPriceForm, setRefPriceForm] = useState({
    komoditasSlug: '',
    komoditasNama: '',
    satuan: 'lembar',
    harga: 350000,
    alasan: 'Penyesuaian berkala SK Kepala Dinas',
  });

  const fetchRfqs = async () => {
    setLoading(true);
    try {
      if (activeTab === 'harga_acuan') {
        const res = await api.get('/reference-prices');
        setReferencePrices(res.data.data || []);
      } else {
        const res = await api.get(`/rfq-verifikasi?tab=${activeTab}`);
        setRfqs(res.data.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, [activeTab]);

  const openActionModal = (rfq, type) => {
    setSelectedRfq(rfq);
    setActionType(type);
    setHargaPenyesuaian(rfq.hargaAcuan);
    setAlasanHarga('Sesuai penetapan harga acuan resmi dinas');
    setCatatanTolak('');
  };

  const handleApproveAndSpread = async () => {
    setSubmitting(true);
    try {
      await api.post(`/rfq/${selectedRfq._id}/setujui`, {
        hargaAcuan: Number(hargaPenyesuaian),
        alasanHarga,
      });
      alert('RFQ berhasil disetujui dan disebarkan ke pelaku UMKM!');
      setSelectedRfq(null);
      fetchRfqs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal menyetujui RFQ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!catatanTolak || catatanTolak.trim().length < 5) {
      alert('Catatan alasan penolakan wajib diisi minimal 5 karakter');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/rfq/${selectedRfq._id}/tolak`, {
        catatan: catatanTolak,
      });
      alert('RFQ telah ditolak dengan catatan resmi.');
      setSelectedRfq(null);
      fetchRfqs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal menolak RFQ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveFinalPo = async (rfqId) => {
    if (!confirm('Validasi kuota 100% dan terbitkan dokumen Purchase Order resmi berkop dinas?')) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/rfq/${rfqId}/terbitkan-po`);
      alert('Purchase Order resmi berhasil diterbitkan!');
      fetchRfqs();
      setActivePoRfqId(rfqId);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal menerbitkan PO');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAllocation = async (rfqId, allocId) => {
    const alasan = prompt('Masukkan alasan pembatalan alokasi oleh dinas:');
    if (!alasan) return;
    try {
      await api.post(`/rfq/${rfqId}/alokasi/${allocId}/batalkan`, { alasan });
      alert('Alokasi berhasil dibatalkan dan kuota dikembalikan ke antrean terbuka.');
      fetchRfqs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal membatalkan alokasi');
    }
  };

  const handleSaveReferencePrice = async () => {
    setSubmitting(true);
    try {
      await api.post('/reference-prices', {
        komoditasSlug: refPriceForm.komoditasSlug,
        komoditasNama: refPriceForm.komoditasNama,
        satuan: refPriceForm.satuan,
        harga: Number(refPriceForm.harga),
      });
      alert('Harga acuan resmi berhasil disimpan!');
      setModalRefPriceOpen(false);
      fetchRfqs();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal menyimpan harga acuan');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
            <Award className="w-4 h-4" />
            <span>Fasilitasi & Verifikasi Pengadaan Bersama Dinas</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Verifikasi RFQ & Penerbitan Purchase Order</h1>
          <p className="text-sm text-slate-300">
            Periksa kewajaran permintaan pesanan mitra, sesuaikan harga acuan resmi, dan terbitkan dokumen PO PDF kesepakatan pasokan bersama.
          </p>
        </div>

        {activeTab === 'harga_acuan' && (
          <Button
            onClick={() => setModalRefPriceOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold shrink-0"
          >
            <Tag className="w-4 h-4 mr-2" />
            Tambah Harga Acuan
          </Button>
        )}
      </div>

      {/* 3 Navigasi Tab (AC-08-01) */}
      <div className="flex border-b border-slate-200 gap-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('menunggu')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'menunggu'
              ? 'border-amber-500 text-navy-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Menunggu Verifikasi & Sebar</span>
        </button>

        <button
          onClick={() => setActiveTab('kuota_penuh')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'kuota_penuh'
              ? 'border-amber-500 text-navy-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span>Kuota Penuh (Siap Terbitkan PO)</span>
        </button>

        <button
          onClick={() => setActiveTab('harga_acuan')}
          className={`py-3 px-4 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'harga_acuan'
              ? 'border-amber-500 text-navy-950 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-4 h-4 text-blue-600" />
          <span>Daftar Harga Acuan Resmi</span>
        </button>
      </div>

      {/* Konten Tab 1: Menunggu Verifikasi */}
      {activeTab === 'menunggu' && (
        <Card>
          <CardHeader className="py-4 px-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Antrean Verifikasi RFQ Baru</h3>
              <p className="text-xs text-slate-500">Periksa volume, tenggat, dan spesifikasi sebelum disebarkan ke UMKM</p>
            </div>
            <span className="text-xs bg-amber-50 text-amber-800 px-3 py-1 rounded-full font-semibold border border-amber-200">
              {rfqs.length} Menunggu
            </span>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Memuat antrean...</div>
            ) : rfqs.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <p>Tidak ada antrean RFQ baru yang menunggu verifikasi.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Kode & Mitra</th>
                      <th className="py-3 px-4">Komoditas & Target</th>
                      <th className="py-3 px-4">Harga Acuan</th>
                      <th className="py-3 px-4">Tenggat Waktu</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rfqs.map((r) => (
                      <tr key={r._id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-navy-950 block">{r.kode}</span>
                          <span className="text-slate-600">{r.mitraUserId?.nama}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 block">{r.komoditasNama}</span>
                          <span className="text-slate-500">{r.kuotaTotal} {r.satuan}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          Rp {r.hargaAcuan?.toLocaleString('id-ID')} / {r.satuan}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {new Date(r.tenggat).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openActionModal(r, 'tolak')}
                            className="text-red-600 hover:bg-red-50 border-red-200"
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Tolak
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openActionModal(r, 'setujui')}
                            className="bg-navy-900 hover:bg-navy-800 text-white"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                            Setujui & Sebar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Konten Tab 2: Kuota Penuh (Siap Terbitkan PO) */}
      {activeTab === 'kuota_penuh' && (
        <div className="space-y-6">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Memuat antrean kuota penuh...</div>
          ) : rfqs.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400 bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
              <Layers className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada RFQ yang mencapai kuota 100%.</p>
            </div>
          ) : (
            rfqs.map((r) => (
              <Card key={r._id} className="overflow-hidden border-2 border-emerald-100">
                <CardHeader className="bg-emerald-50/60 p-5 border-b border-emerald-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                      {r.kode} - KUOTA 100% TERPENUHI
                    </span>
                    <h3 className="text-base font-bold text-navy-950 mt-1">
                      {r.komoditasNama} ({r.kuotaTotal} {r.satuan}) - Mitra: {r.mitraUserId?.nama}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Total Nilai Kesepakatan: <strong>Rp {(r.kuotaTotal * r.hargaAcuan).toLocaleString('id-ID')}</strong>
                    </p>
                  </div>
                  <Button
                    onClick={() => handleApproveFinalPo(r._id)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shrink-0 shadow-md"
                  >
                    <FileCheck className="w-4 h-4 mr-1.5" />
                    Setujui & Terbitkan Dokumen PO Resmi (.PDF)
                  </Button>
                </CardHeader>

                <CardContent className="p-0">
                  <div className="p-4 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wide">
                      Tabel Alokasi Pelaku UMKM ({r.alokasi?.length || 0} Usaha):
                    </span>
                    <span className="text-slate-500">
                      Periksa kelayakan masing-masing UMKM sebelum pengesahan PO
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-white text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-4">Nama Pelaku UMKM</th>
                          <th className="py-2.5 px-4">Kecamatan</th>
                          <th className="py-2.5 px-4">Produk Pilihan</th>
                          <th className="py-2.5 px-4 text-right">Porsi Kuota</th>
                          <th className="py-2.5 px-4 text-right">Estimasi Nilai</th>
                          <th className="py-2.5 px-4 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {r.alokasi?.map((a) => (
                          <tr key={a._id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold text-slate-900">{a.businessId?.namaUsaha}</td>
                            <td className="py-2.5 px-4 text-slate-600">{a.businessId?.kecamatan}</td>
                            <td className="py-2.5 px-4 text-slate-600">{a.productId?.nama}</td>
                            <td className="py-2.5 px-4 text-right font-bold text-navy-950">
                              {a.jumlah} {r.satuan}
                            </td>
                            <td className="py-2.5 px-4 text-right font-semibold text-emerald-800">
                              Rp {a.nilai?.toLocaleString('id-ID')}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelAllocation(r._id, a._id)}
                                className="text-red-600 hover:bg-red-50 text-[11px]"
                              >
                                Batalkan Alokasi
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Konten Tab 3: Daftar Harga Acuan Resmi */}
      {activeTab === 'harga_acuan' && (
        <Card>
          <CardHeader className="py-4 px-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Harga Acuan Resmi Dinas Koperasi & UKM</h3>
              <p className="text-xs text-slate-500">Dasar acuan penetapan harga pesanan borongan (RFQ) di Kabupaten Lebak</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Slug Komoditas</th>
                    <th className="py-3 px-4">Nama Komoditas Resmi</th>
                    <th className="py-3 px-4">Satuan</th>
                    <th className="py-3 px-4 text-right">Harga Acuan Resmi</th>
                    <th className="py-3 px-4">Terakhir Diperbarui</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referencePrices.map((rp) => (
                    <tr key={rp._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono text-slate-600">{rp.komoditasSlug}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{rp.komoditasNama}</td>
                      <td className="py-3 px-4 text-slate-600">{rp.satuan}</td>
                      <td className="py-3 px-4 text-right font-extrabold text-navy-950 text-sm">
                        Rp {rp.harga?.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(rp.updatedAt).toLocaleDateString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal Aksi Verifikasi RFQ (Setujui / Tolak) */}
      {selectedRfq && actionType && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRfq(null)}
          title={
            actionType === 'setujui'
              ? `Setujui & Sebar RFQ: ${selectedRfq.kode}`
              : `Tolak RFQ: ${selectedRfq.kode}`
          }
          size="md"
          footer={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setSelectedRfq(null)}>
                Batal
              </Button>
              {actionType === 'setujui' ? (
                <Button
                  size="sm"
                  disabled={submitting}
                  onClick={handleApproveAndSpread}
                  className="bg-navy-900 hover:bg-navy-800 text-white"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Konfirmasi & Sebar ke UMKM
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={submitting}
                  onClick={handleReject}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Konfirmasi Penolakan
                </Button>
              )}
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {actionType === 'setujui' ? (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                  <span className="font-bold text-blue-900 block">Kewajaran Pesanan Terpenuhi:</span>
                  <p className="text-blue-800">
                    Setelah disetujui, RFQ ini akan tampil di dasbor seluruh pelaku UMKM terkurasi dengan komoditas{' '}
                    <strong>{selectedRfq.komoditasNama}</strong>.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Penyesuaian Harga Acuan Resmi (Rp / {selectedRfq.satuan}):
                  </label>
                  <input
                    type="number"
                    value={hargaPenyesuaian}
                    onChange={(e) => setHargaPenyesuaian(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Harga ini akan dikunci sebagai snapshot nilai pembayaran kepada UMKM.
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Catatan Alasan Penetapan Harga:
                  </label>
                  <input
                    type="text"
                    value={alasanHarga}
                    onChange={(e) => setAlasanHarga(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900">
                  <span className="font-bold block">Alasan Penolakan RFQ:</span>
                  <p className="mt-0.5">
                    Catatan ini akan dikirimkan kepada mitra pembeli agar dapat diperbaiki dan diajukan ulang.
                  </p>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Catatan Wajib:</label>
                  <textarea
                    rows="3"
                    placeholder="Contoh: Tenggat waktu terlalu singkat untuk kapasitas produksi tenun Baduy atau spesifikasi mutu belum jelas."
                    value={catatanTolak}
                    onChange={(e) => setCatatanTolak(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Modal Tambah Harga Acuan Resmi */}
      {modalRefPriceOpen && (
        <Modal
          isOpen={true}
          onClose={() => setModalRefPriceOpen(false)}
          title="Tambah Harga Acuan Resmi Komoditas"
          size="md"
          footer={
            <div className="flex justify-end gap-2 w-full">
              <Button variant="outline" size="sm" onClick={() => setModalRefPriceOpen(false)}>
                Batal
              </Button>
              <Button
                size="sm"
                disabled={submitting}
                onClick={handleSaveReferencePrice}
                className="bg-navy-900 hover:bg-navy-800 text-white"
              >
                Simpan Harga Acuan
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Slug Komoditas:</label>
              <input
                type="text"
                placeholder="Contoh: gula-aren-semut"
                value={refPriceForm.komoditasSlug}
                onChange={(e) => setRefPriceForm({ ...refPriceForm, komoditasSlug: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nama Komoditas:</label>
              <input
                type="text"
                placeholder="Contoh: Gula Aren Semut Organik Lebak"
                value={refPriceForm.komoditasNama}
                onChange={(e) => setRefPriceForm({ ...refPriceForm, komoditasNama: e.target.value })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Satuan:</label>
                <input
                  type="text"
                  placeholder="Contoh: pak, lembar, botol"
                  value={refPriceForm.satuan}
                  onChange={(e) => setRefPriceForm({ ...refPriceForm, satuan: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Harga Acuan (Rp):</label>
                <input
                  type="number"
                  value={refPriceForm.harga}
                  onChange={(e) => setRefPriceForm({ ...refPriceForm, harga: e.target.value })}
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>
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

export default RfqDinasPage;
