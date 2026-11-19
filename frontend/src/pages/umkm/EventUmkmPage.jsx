// ============================================================================
// Halaman Event & Pameran UMKM (frontend/src/pages/umkm/EventUmkmPage.jsx)
// [PBI-12] Event Daerah dan Pendaftaran Stan (FR-09)
// PIC: Fariz | Aktor: umkm
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  FileCheck,
  CheckCircle,
  AlertCircle,
  XCircle,
  ShoppingBag,
  History,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';

export function EventUmkmPage() {
  const { user } = useAuth();
  const isUmkmActive = user?.status === 'aktif';

  const [activeTab, setActiveTab] = useState('tersedia'); // 'tersedia' | 'riwayat'
  const [events, setEvents] = useState([]);
  const [history, setHistory] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Modal Pendaftaran Stan
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOpenEvents();
    fetchMyProducts();
    fetchHistory();
  }, []);

  const fetchOpenEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/events');
      setEvents(res.data?.items || res.data || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat agenda event terbuka');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProducts = async () => {
    try {
      const res = await api.get('/products');
      const prods = res.data?.items || res.data || [];
      setMyProducts(prods.filter((p) => p.statusKurasi === 'terkurasi'));
    } catch (err) {
      console.warn('Gagal memuat produk terkurasi:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/events/riwayat/saya');
      setHistory(res.data?.items || res.data || []);
    } catch (err) {
      console.warn('Gagal memuat riwayat partisipasi:', err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    if (selectedEvent.syaratKurasi && !selectedProductId) {
      alert('Pameran ini mewajibkan Anda memilih produk yang sudah lolos kurasi dinas.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post(`/events/${selectedEvent._id}/daftar`, {
        productId: selectedProductId || undefined,
      });
      setSuccessMsg(
        'Pendaftaran stan berhasil diajukan! Menunggu verifikasi berkas oleh staf dinas.',
      );
      setSelectedEvent(null);
      setSelectedProductId('');
      // Refresh events & history
      fetchOpenEvents();
      fetchHistory();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Gagal mendaftar event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async (eventId) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pendaftaran stan event ini?')) return;
    try {
      await api.delete(`/events/${eventId}/daftar`);
      setSuccessMsg('Pendaftaran stan berhasil dibatalkan. Kuota telah dikembalikan.');
      fetchOpenEvents();
      fetchHistory();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal membatalkan pendaftaran');
    }
  };

  const registeredEventIds = new Set(
    history
      .filter((h) => ['menunggu_verifikasi', 'disetujui'].includes(h.status))
      .map((h) => h.eventId?._id || h.eventId),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Fasilitasi Promosi & Pemasaran
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-1">
            Agenda Event & Pameran Daerah
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftarkan produk unggulan usaha Anda pada pameran expo dan pelatihan binaan Diskop UKM
            Lebak.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('tersedia')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'tersedia'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Jadwal Event Dibuka ({events.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('riwayat')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'riwayat'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Riwayat Partisipasi ({history.length})
          </button>
        </div>
      </div>

      {!isUmkmActive && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>
            Akun Anda saat ini belum <strong>Aktif</strong> (sedang diverifikasi dinas). Anda dapat
            melihat agenda event namun belum dapat mendaftar stan.
          </span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Konten Tab 1: Event Terbuka */}
      {activeTab === 'tersedia' && (
        <div>
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Memuat agenda event pameran...
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">Belum Ada Event Dibuka</p>
              <p className="text-xs text-slate-400">
                Dinas Koperasi & UMKM Lebak belum membuka pendaftaran stan baru saat ini.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((ev) => {
                const isRegistered = registeredEventIds.has(ev._id);
                const isFull = (ev.terisi || 0) >= ev.kuota;
                const deadlinePassed = new Date(ev.tenggatDaftar) < new Date();
                const canRegister =
                  isUmkmActive &&
                  !isRegistered &&
                  !isFull &&
                  !deadlinePassed &&
                  (!ev.syaratKurasi || myProducts.length > 0);

                const pct = Math.min(100, Math.round(((ev.terisi || 0) / ev.kuota) * 100));

                return (
                  <Card key={ev._id} className="flex flex-col justify-between overflow-hidden">
                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            ev.jenis === 'pameran'
                              ? 'bg-indigo-50 text-indigo-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          {ev.jenis === 'pameran' ? 'Pameran / Expo' : 'Pelatihan Kemasan/Halal'}
                        </span>
                        {ev.syaratKurasi && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> Wajib Terkurasi
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-navy-900 text-base leading-snug">
                        {ev.nama}
                      </h3>

                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                        {ev.deskripsi || 'Fasilitasi promosi komoditas UMKM Kabupaten Lebak.'}
                      </p>
                    </CardHeader>

                    <CardContent className="p-5 pt-0 space-y-4">
                      {/* Info Detail */}
                      <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                        <div className="flex items-center gap-2 text-slate-700">
                          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            {new Date(ev.tanggalMulai).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            s/d{' '}
                            {new Date(ev.tanggalSelesai).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-700">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{ev.lokasi}</span>
                        </div>

                        <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>
                            Batas pendaftaran:{' '}
                            <strong>
                              {new Date(ev.tenggatDaftar).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Bar Kuota Stan */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                          <span>Kapasitas Stan</span>
                          <span className={isFull ? 'text-rose-600' : 'text-slate-600'}>
                            {ev.terisi} / {ev.kuota} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              isFull ? 'bg-rose-500' : pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Tombol Aksi */}
                      <div>
                        {isRegistered ? (
                          <div className="text-center py-2 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Anda Sudah Terdaftar</span>
                          </div>
                        ) : isFull ? (
                          <Button disabled variant="outline" className="w-full text-xs">
                            Pendaftaran Ditutup (Stan Penuh)
                          </Button>
                        ) : deadlinePassed ? (
                          <Button disabled variant="outline" className="w-full text-xs">
                            Pendaftaran Ditutup (Lewat Tenggat)
                          </Button>
                        ) : !canRegister ? (
                          <Button disabled variant="outline" className="w-full text-xs">
                            {ev.syaratKurasi && myProducts.length === 0
                              ? 'Belum Ada Produk Terkurasi'
                              : 'Akun Belum Aktif'}
                          </Button>
                        ) : (
                          <Button
                            variant="primary"
                            className="w-full text-xs gap-1.5"
                            onClick={() => {
                              setSelectedEvent(ev);
                              setSelectedProductId(myProducts[0]?._id || '');
                            }}
                          >
                            <span>Daftar Stan Sekarang</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Konten Tab 2: Riwayat Partisipasi */}
      {activeTab === 'riwayat' && (
        <Card>
          <CardContent className="p-0">
            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Anda belum pernah mendaftar agenda event pameran daerah.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Nama Event & Lokasi</th>
                      <th className="px-4 py-3">Jadwal Event</th>
                      <th className="px-4 py-3">Produk Dipamerkan</th>
                      <th className="px-4 py-3">Status Stan</th>
                      <th className="px-4 py-3">Catatan Verifikator</th>
                      <th className="px-5 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((h) => {
                      const ev = h.eventId || {};
                      const isUnstarted = ev.tanggalMulai
                        ? new Date(ev.tanggalMulai) > new Date()
                        : false;
                      const canCancel =
                        isUnstarted && ['menunggu_verifikasi', 'disetujui'].includes(h.status);

                      return (
                        <tr key={h._id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-4">
                            <p className="font-bold text-navy-900 text-sm">{ev.nama || 'Event'}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span>{ev.lokasi || '-'}</span>
                            </p>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <p className="font-semibold text-slate-800">
                              {ev.tanggalMulai
                                ? new Date(ev.tanggalMulai).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })
                                : '-'}
                            </p>
                          </td>
                          <td className="px-4 py-4">
                            {h.productId ? (
                              <span className="font-semibold text-slate-800">
                                {h.productId.nama}
                              </span>
                            ) : (
                              <span className="text-slate-400">Tidak ada produk spesifik</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <Badge status={h.status} />
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-slate-500 italic">
                              {h.catatan ? `"${h.catatan}"` : '-'}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {canCancel ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() => handleCancelRegistration(ev._id)}
                              >
                                Batalkan
                              </Button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
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
      )}

      {/* Modal Pendaftaran Stan */}
      <Modal
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={`Konfirmasi Pendaftaran Stan: ${selectedEvent?.nama || ''}`}
        size="md"
      >
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
            <p className="text-slate-600">
              Lokasi: <strong>{selectedEvent?.lokasi}</strong>
            </p>
            <p className="text-slate-600">
              Pelaksanaan:{' '}
              <strong>
                {selectedEvent &&
                  new Date(selectedEvent.tanggalMulai).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
              </strong>
            </p>
            <p className="text-slate-500 text-[11px]">
              Alokasi stan bersifat atomik. Setelah mendaftar, berkas Anda akan diperiksa tim
              verifikator dinas.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Produk Unggulan yang Dipamerkan{' '}
              {selectedEvent?.syaratKurasi && <span className="text-rose-500">*</span>}
            </label>
            {myProducts.length === 0 ? (
              <p className="text-xs text-amber-600 italic">
                Anda belum memiliki produk terkurasi. Anda dapat mendaftarkan produk terlebih dahulu
                di menu Produk Saya.
              </p>
            ) : (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                required={selectedEvent?.syaratKurasi}
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-navy-900"
              >
                <option value="">-- Pilih Produk Terkurasi --</option>
                {myProducts.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.nama} (Grade {p.grade || 'B'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedEvent(null)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Mendaftarkan Stan...' : 'Konfirmasi & Daftar Stan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default EventUmkmPage;
