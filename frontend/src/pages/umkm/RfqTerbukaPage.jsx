// ============================================================================
// [PBI-10] Halaman Agregasi Kuota & RFQ Terbuka UMKM (frontend/src/pages/umkm/RfqTerbukaPage.jsx)
// PIC: Naila | Layar Pengambilan Kuota Pasokan Bersama & Kunci Komitmen
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Lock,
  XCircle,
  Package,
  Layers,
  ArrowRight,
  FileCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import api from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PoViewModal } from '../shared/po/PoViewModal.jsx';

export function RfqTerbukaPage() {
  const [dataOpen, setDataOpen] = useState({ cocok: false, rfqs: [], produkSaya: [] });
  const [loading, setLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [loadingAlloc, setLoadingAlloc] = useState(false);

  // Form Ambil Kuota
  const [selectedProductId, setSelectedProductId] = useState('');
  const [capacityInfo, setCapacityInfo] = useState(null);
  const [jumlahAmbil, setJumlahAmbil] = useState(10);
  const [tglSelesai, setTglSelesai] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [activePoRfqId, setActivePoRfqId] = useState(null);

  const fetchOpenRfqs = async () => {
    try {
      const res = await api.get('/rfq/terbuka');
      setDataOpen(res.data.data || { cocok: false, rfqs: [], produkSaya: [] });
      if (res.data.data?.produkSaya?.length > 0 && !selectedProductId) {
        setSelectedProductId(res.data.data.produkSaya[0]._id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpenRfqs();
    // AC-10-12: Polling otomatis setiap 30 detik
    const timer = setInterval(fetchOpenRfqs, 30000);
    return () => clearInterval(timer);
  }, []);

  const openDetailModal = async (rfq) => {
    setSelectedRfq(rfq);
    setFormError('');
    // Set default tanggal perkiraan selesai: 7 hari sebelum tenggat atau min 3 hari
    const tenggatDate = new Date(rfq.tenggat);
    const targetDate = new Date(tenggatDate.getTime() - 3 * 24 * 60 * 60 * 1000);
    setTglSelesai(targetDate.toISOString().split('T')[0]);

    setLoadingAlloc(true);
    try {
      const res = await api.get(`/rfq/${rfq._id}/alokasi`);
      setAllocations(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAlloc(false);
    }

    // Ambil info kapasitas produk pilihan
    if (selectedProductId) {
      fetchCapacityInfo(rfq._id, selectedProductId);
    }
  };

  const fetchCapacityInfo = async (rfqId, prodId) => {
    try {
      const res = await api.get(`/rfq/${rfqId}/kuota/info?productId=${prodId}`);
      setCapacityInfo(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProductChange = (prodId) => {
    setSelectedProductId(prodId);
    if (selectedRfq) {
      fetchCapacityInfo(selectedRfq._id, prodId);
    }
  };

  const handleTakeQuota = async () => {
    setFormError('');
    setSubmitting(true);
    try {
      await api.post(`/rfq/${selectedRfq._id}/kuota`, {
        productId: selectedProductId,
        jumlah: Number(jumlahAmbil),
        tanggalPerkiraanSelesai: new Date(tglSelesai).toISOString(),
      });

      alert('Komitmen kuota pasokan berhasil dikunci!');
      await fetchOpenRfqs();
      // Segarkan detail modal
      openDetailModal(selectedRfq);
    } catch (err) {
      setFormError(err.response?.data?.error?.message || 'Gagal mengambil kuota. Kuota mungkin baru saja berubah.');
      // Refresh list bila terjadi konflik kuota (AC-10-09)
      fetchOpenRfqs();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelMyQuota = async () => {
    if (!confirm('Apakah Anda yakin ingin membatalkan komitmen kuota pasokan Anda?')) return;
    setSubmitting(true);
    try {
      await api.delete(`/rfq/${selectedRfq._id}/kuota`);
      alert('Komitmen kuota pasokan berhasil dibatalkan.');
      await fetchOpenRfqs();
      openDetailModal(selectedRfq);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal membatalkan kuota');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Hero */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
            <Layers className="w-4 h-4" />
            <span>Peluang Pesanan Skala Besar (Agregasi Kuota Bersama)</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Permintaan Pesanan Terbuka untuk Produk Anda</h1>
          <p className="text-sm text-slate-300">
            Ambil sebagian porsi pasokan sesuai kapasitas produksi bulanan Anda. Saat total kuota mencapai 100%, dinas akan menerbitkan dokumen Purchase Order resmi.
          </p>
        </div>
      </div>

      {/* Kondisi AC-10-02: UMKM belum punya produk terkurasi */}
      {!loading && !dataOpen.cocok && (
        <Card className="p-8 text-center bg-amber-50/50 border-amber-200 space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">Produk Usaha Anda Belum Terkurasi</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Halaman ini hanya menampilkan pesanan borongan untuk komoditas yang telah lulus kurasi resmi dinas (Grade A atau B).
            </p>
          </div>
          <Link to="/umkm/produk">
            <Button size="sm" className="bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold">
              <Package className="w-4 h-4 mr-1.5" />
              Kelola & Ajukan Kurasi Produk Sekarang
            </Button>
          </Link>
        </Card>
      )}

      {/* Grid RFQ Terbuka yang Cocok (AC-10-01) */}
      {!loading && dataOpen.cocok && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Daftar Pesanan Terbuka ({dataOpen.rfqs?.length || 0} RFQ)
            </h2>
            <span className="text-[11px] text-slate-400">Sinkronisasi otomatis setiap 30 detik</span>
          </div>

          {dataOpen.rfqs?.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Belum Ada RFQ Terbuka Saat Ini</p>
              <p className="text-xs text-slate-400">
                Ketika ada mitra pembeli mengajukan pesanan yang cocok dengan komoditas Anda, pesanan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {dataOpen.rfqs?.map((rfq) => {
                const sisa = rfq.sisaKuota ?? (rfq.kuotaTotal - rfq.kuotaTerkumpul);
                const pct = rfq.persentaseTerkumpul ?? Math.round((rfq.kuotaTerkumpul / rfq.kuotaTotal) * 100);

                return (
                  <Card key={rfq._id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                    <div className="p-5 space-y-4">
                      {/* Header Kartu */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            {rfq.kode}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-1">{rfq.komoditasNama}</h3>
                          <p className="text-xs text-slate-500">Pemesan: {rfq.mitraUserId?.nama || 'Mitra B2B'}</p>
                        </div>
                        <Badge variant={rfq.alokasiSaya ? 'success' : 'info'}>
                          {rfq.alokasiSaya ? 'Tergabung' : 'Terbuka'}
                        </Badge>
                      </div>

                      {/* Ringkasan Kuota 3 Kolom (AC-10-03) */}
                      <div className="bg-navy-950 text-white rounded-xl p-3.5 space-y-2">
                        <div className="grid grid-cols-3 text-center divide-x divide-navy-800">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase">Target</span>
                            <p className="text-sm font-bold text-white mt-0.5">
                              {rfq.kuotaTotal} {rfq.satuan}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase">Terkumpul</span>
                            <p className="text-sm font-bold text-amber-400 mt-0.5">
                              {rfq.kuotaTerkumpul} {rfq.satuan}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase">Sisa Kuota</span>
                            <p className="text-sm font-bold text-emerald-400 mt-0.5">
                              {sisa} {rfq.satuan}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-1 pt-1">
                          <div className="w-full bg-navy-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full transition-all"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span>Agregasi UMKM</span>
                            <span className="font-bold text-slate-200">{pct}% Terpenuhi</span>
                          </div>
                        </div>
                      </div>

                      {/* Info Harga & Batas Waktu */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Harga Kesepakatan</span>
                          <span className="font-bold text-slate-900">
                            Rp {rfq.hargaAcuan?.toLocaleString('id-ID')}
                          </span>
                          <span className="text-[10px] text-slate-500"> / {rfq.satuan}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Tenggat Pengisian</span>
                          <span className="font-bold text-slate-900">
                            {new Date(rfq.tenggat).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Komitmen Saya Jika Ada */}
                      {rfq.alokasiSaya && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-emerald-900 block">Komitmen Anda Terkunci</span>
                            <span className="text-emerald-700 text-[11px]">
                              {rfq.alokasiSaya.jumlah} {rfq.satuan} (Rp {rfq.alokasiSaya.nilai?.toLocaleString('id-ID')})
                            </span>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                      )}
                    </div>

                    {/* Tombol Aksi Bawah */}
                    <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        {rfq.alokasiSaya ? 'Lihat / Ubah Komitmen' : 'Peluang Terbuka'}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => openDetailModal(rfq)}
                        className={rfq.alokasiSaya ? 'bg-navy-900 text-white' : 'bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold'}
                      >
                        <span>{rfq.alokasiSaya ? 'Kelola Komitmen' : 'Lihat & Ambil Kuota'}</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal Detail & Panel Ambil Kuota (AC-10-03 s/d AC-10-08) */}
      {selectedRfq && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedRfq(null)}
          title={`Agregasi Kuota Pesanan: ${selectedRfq.kode} (${selectedRfq.komoditasNama})`}
          size="xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
            {/* Sisi Kiri: Ringkasan Kuota & Tabel Alokasi */}
            <div className="lg:col-span-7 space-y-4">
              {/* Kartu Ringkasan Navy */}
              <div className="bg-navy-950 text-white rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs border-b border-navy-800 pb-2">
                  <span className="text-slate-400">Komoditas:</span>
                  <span className="font-bold text-amber-300">{selectedRfq.komoditasNama}</span>
                </div>
                <div className="grid grid-cols-3 text-center divide-x divide-navy-800">
                  <div>
                    <span className="text-[10px] text-slate-400">Target Volume</span>
                    <p className="text-base font-extrabold text-white mt-1">
                      {selectedRfq.kuotaTotal} {selectedRfq.satuan}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Terkumpul</span>
                    <p className="text-base font-extrabold text-amber-400 mt-1">
                      {selectedRfq.kuotaTerkumpul} {selectedRfq.satuan}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">Sisa Kuota</span>
                    <p className="text-base font-extrabold text-emerald-400 mt-1">
                      {Math.max(0, selectedRfq.kuotaTotal - selectedRfq.kuotaTerkumpul)} {selectedRfq.satuan}
                    </p>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <div className="w-full bg-navy-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((selectedRfq.kuotaTerkumpul / selectedRfq.kuotaTotal) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Progres Pasokan Kolektif</span>
                    <span className="font-bold text-white">
                      {Math.round((selectedRfq.kuotaTerkumpul / selectedRfq.kuotaTotal) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabel Alokasi Peserta UMKM (AC-10-04) */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-800 uppercase tracking-wide text-xs">
                  Daftar Pelaku UMKM yang Tergabung ({allocations.length})
                </h4>
                {loadingAlloc ? (
                  <p className="text-slate-400 py-4 text-center">Memuat daftar alokasi...</p>
                ) : allocations.length === 0 ? (
                  <p className="text-slate-400 py-4 text-center bg-slate-50 rounded-lg">
                    Belum ada UMKM yang mengambil kuota. Jadilah yang pertama!
                  </p>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">UMKM</th>
                          <th className="py-2 px-3">Kecamatan</th>
                          <th className="py-2 px-3 text-right">Porsi</th>
                          <th className="py-2 px-3 text-right">Nilai Kontrak</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allocations.map((a) => (
                          <tr key={a._id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-900">{a.businessId?.namaUsaha}</td>
                            <td className="py-2 px-3 text-slate-600">{a.businessId?.kecamatan}</td>
                            <td className="py-2 px-3 text-right font-bold text-navy-950">
                              {a.jumlah} {selectedRfq.satuan}
                            </td>
                            <td className="py-2 px-3 text-right font-semibold text-emerald-800">
                              Rp {a.nilai?.toLocaleString('id-ID')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Sisi Kanan: Form Ambil Kuota Pasokan (AC-10-05 s/d AC-10-08) */}
            <div className="lg:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-sm">Ambil Kuota Pasokan</h4>
                <p className="text-[11px] text-slate-500">
                  Harga resmi: Rp {selectedRfq.hargaAcuan?.toLocaleString('id-ID')} / {selectedRfq.satuan}
                </p>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 text-red-900 rounded-lg border border-red-200 text-xs">
                  {formError}
                </div>
              )}

              {/* Jika UMKM sudah memiliki komitmen aktif di RFQ ini */}
              {selectedRfq.alokasiSaya ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                    <span className="font-bold text-emerald-900 block text-xs">
                      Komitmen Anda Telah Terkunci
                    </span>
                    <div className="space-y-1 text-xs text-emerald-800">
                      <p>
                        Volume: <strong>{selectedRfq.alokasiSaya.jumlah} {selectedRfq.satuan}</strong>
                      </p>
                      <p>
                        Total Nilai: <strong>Rp {selectedRfq.alokasiSaya.nilai?.toLocaleString('id-ID')}</strong>
                      </p>
                      <p>
                        Perkiraan Selesai:{' '}
                        <strong>
                          {new Date(selectedRfq.alokasiSaya.tanggalPerkiraanSelesai).toLocaleDateString('id-ID')}
                        </strong>
                      </p>
                    </div>
                  </div>

                  {selectedRfq.status === 'terbuka' && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={submitting}
                      onClick={handleCancelMyQuota}
                      className="w-full text-red-600 hover:bg-red-50 border-red-300"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Batalkan Komitmen Saya
                    </Button>
                  )}

                  {selectedRfq.status === 'proses_verifikasi' && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      Kuota telah 100% penuh. Menunggu staf dinas memvalidasi dan menerbitkan dokumen PO resmi.
                    </p>
                  )}

                  {selectedRfq.status === 'terpenuhi' && (
                    <Button
                      size="sm"
                      onClick={() => setActivePoRfqId(selectedRfq._id)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <FileCheck className="w-4 h-4 mr-1.5" />
                      Lihat Dokumen PO (.PDF)
                    </Button>
                  )}
                </div>
              ) : (
                /* Form Pengambilan Kuota Baru */
                <div className="space-y-3">
                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Pilih Produk Terkurasi Anda:</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => handleProductChange(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
                    >
                      {dataOpen.produkSaya?.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.nama} (Kapasitas: {p.kapasitasBulanan} {p.satuan})
                        </option>
                      ))}
                    </select>
                  </div>

                  {capacityInfo && (
                    <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1 text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Kapasitas Bulanan:</span>
                        <span className="font-semibold">{capacityInfo.kapasitasBulanan} {capacityInfo.satuan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Tersisa Bulan Ini:</span>
                        <span className="font-bold text-emerald-700">{capacityInfo.tersisaBulanIni} {capacityInfo.satuan}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Sisa Kuota Terbuka:</span>
                        <span className="font-bold text-amber-700">{capacityInfo.sisaKuotaRfq} {capacityInfo.satuan}</span>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Jumlah Kuota yang Sanggup Dipasok ({selectedRfq.satuan}):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={capacityInfo?.sisaKuotaRfq || 1000}
                      value={jumlahAmbil}
                      onChange={(e) => setJumlahAmbil(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                    {capacityInfo && Number(jumlahAmbil) > capacityInfo.sisaKuotaRfq && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">
                        Melebihi sisa kuota terbuka ({capacityInfo.sisaKuotaRfq} {selectedRfq.satuan})
                      </p>
                    )}
                    {capacityInfo && Number(jumlahAmbil) > capacityInfo.tersisaBulanIni && (
                      <p className="text-[11px] text-red-600 font-semibold mt-1">
                        Melebihi kapasitas bulanan produk Anda ({capacityInfo.tersisaBulanIni} {selectedRfq.satuan})
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">
                      Perkiraan Tanggal Selesai Produksi:
                    </label>
                    <input
                      type="date"
                      value={tglSelesai}
                      onChange={(e) => setTglSelesai(e.target.value)}
                      className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Tenggat RFQ: {new Date(selectedRfq.tenggat).toLocaleDateString('id-ID')}
                    </span>
                  </div>

                  <div className="pt-2">
                    <Button
                      size="sm"
                      disabled={
                        submitting ||
                        !jumlahAmbil ||
                        (capacityInfo && Number(jumlahAmbil) > capacityInfo.sisaKuotaRfq) ||
                        (capacityInfo && Number(jumlahAmbil) > capacityInfo.tersisaBulanIni)
                      }
                      onClick={handleTakeQuota}
                      className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold"
                    >
                      <Lock className="w-3.5 h-3.5 mr-1.5" />
                      Kunci Komitmen Kuota
                    </Button>
                  </div>
                </div>
              )}
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

export default RfqTerbukaPage;
