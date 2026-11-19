// ============================================================================
// Halaman Manajemen Event & Pameran Daerah (Dinas: Staf & Kabid)
// [PBI-12] Event Daerah dan Pendaftaran Stan (FR-09)
// PIC: Fariz | Aktor: staf, kabid
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  FileCheck,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
} from 'lucide-react';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';

export function EventDinasPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Filter
  const [filterJenis, setFilterJenis] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal Create Event
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    jenis: 'pameran',
    deskripsi: '',
    lokasi: '',
    tanggalMulai: '',
    tanggalSelesai: '',
    kuota: 20,
    tenggatDaftar: '',
    syaratKurasi: true,
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Modal Peserta
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [isPesertaModalOpen, setIsPesertaModalOpen] = useState(false);

  // Modal Verifikasi Peserta
  const [verifTarget, setVerifTarget] = useState(null);
  const [verifAction, setVerifAction] = useState('setuju'); // 'setuju' | 'tolak'
  const [verifCatatan, setVerifCatatan] = useState('');
  const [verifSubmitting, setVerifSubmitting] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [filterJenis, filterStatus]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (filterJenis) params.jenis = filterJenis;
      if (filterStatus) params.status = filterStatus;

      const res = await api.get('/events', { params });
      setEvents(res.data?.items || res.data || []);
    } catch (err) {
      setError(err.message || 'Gagal memuat agenda event');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setFormSubmitting(true);
      await api.post('/events', {
        ...formData,
        kuota: parseInt(formData.kuota, 10),
      });
      setSuccessMsg('Event baru berhasil dibuat (status Draf)');
      setIsCreateOpen(false);
      setFormData({
        nama: '',
        jenis: 'pameran',
        deskripsi: '',
        lokasi: '',
        tanggalMulai: '',
        tanggalSelesai: '',
        kuota: 20,
        tenggatDaftar: '',
        syaratKurasi: true,
      });
      fetchEvents();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal membuat event baru');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handlePublish = async (id) => {
    if (!window.confirm('Publikasikan event ini agar terbuka untuk pendaftaran UMKM?')) return;
    try {
      await api.post(`/events/${id}/publikasi`);
      setSuccessMsg('Event resmi dibuka untuk pendaftaran');
      fetchEvents();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal mempublikasikan event');
    }
  };

  const handleCloseEvent = async (id) => {
    if (!window.confirm('Tutup pendaftaran event ini secara manual?')) return;
    try {
      await api.post(`/events/${id}/tutup`);
      setSuccessMsg('Pendaftaran event telah ditutup');
      fetchEvents();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal menutup event');
    }
  };

  const openParticipants = async (eventItem) => {
    setSelectedEvent(eventItem);
    setIsPesertaModalOpen(true);
    try {
      setLoadingParticipants(true);
      const res = await api.get(`/events/${eventItem._id}/peserta`);
      setParticipants(res.data?.items || res.data || []);
    } catch (err) {
      alert(err.message || 'Gagal memuat daftar peserta');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleVerifikasiParticipant = async (e) => {
    e.preventDefault();
    if (!selectedEvent || !verifTarget) return;

    try {
      setVerifSubmitting(true);
      await api.patch(`/events/${selectedEvent._id}/peserta/${verifTarget._id}`, {
        keputusan: verifAction,
        catatan: verifCatatan,
      });
      setSuccessMsg(
        verifAction === 'setuju' ? 'Pendaftaran stan disetujui' : 'Pendaftaran stan ditolak',
      );
      setVerifTarget(null);
      setVerifCatatan('');
      // Refresh participants & events count
      const res = await api.get(`/events/${selectedEvent._id}/peserta`);
      setParticipants(res.data?.items || res.data || []);
      fetchEvents();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Gagal memproses verifikasi peserta');
    } finally {
      setVerifSubmitting(false);
    }
  };

  const handleExportParticipants = (eventId) => {
    window.open(`/api/v1/events/${eventId}/peserta/export`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Modul Pameran & Pelatihan Binaan
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-1">
            Manajemen Agenda Event Daerah
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Publikasikan jadwal expo kemitraan, seleksi stan terkurasi, dan pantau kuota secara atomik.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Buat Agenda Event</span>
        </Button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-medium flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold">
          <Filter className="w-4 h-4" />
          <span>Filter:</span>
        </div>

        <select
          value={filterJenis}
          onChange={(e) => setFilterJenis(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
        >
          <option value="">Semua Jenis (Pameran & Pelatihan)</option>
          <option value="pameran">Pameran / Expo</option>
          <option value="pelatihan">Pelatihan Kapasitas</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-xs px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-medium text-slate-700"
        >
          <option value="">Semua Status</option>
          <option value="dibuka">Dibuka</option>
          <option value="draf">Draf</option>
          <option value="ditutup">Ditutup</option>
        </select>

        <Button variant="outline" size="sm" onClick={fetchEvents} className="ml-auto text-xs">
          Segarkan Data
        </Button>
      </div>

      {/* Tabel Agenda Event */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Memuat data agenda event daerah...
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Belum ada agenda event terdaftar.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3">Nama Event & Jenis</th>
                    <th className="px-4 py-3">Jadwal Pelaksanaan</th>
                    <th className="px-4 py-3">Lokasi</th>
                    <th className="px-4 py-3">Keterisian Stan</th>
                    <th className="px-4 py-3">Syarat Kurasi</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {events.map((ev) => {
                    const isClosed = ev.status === 'ditutup' || ev.terisi >= ev.kuota;
                    const pct = Math.min(100, Math.round(((ev.terisi || 0) / ev.kuota) * 100));

                    return (
                      <tr key={ev._id} className="hover:bg-slate-50/50 transition">
                        <td className="px-5 py-4">
                          <p className="font-bold text-navy-900 text-sm">{ev.nama}</p>
                          <span
                            className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ev.jenis === 'pameran'
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {ev.jenis === 'pameran' ? 'Expo Promosi' : 'Pelatihan Kemasan/Halal'}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <p className="font-semibold text-slate-800">
                            {new Date(ev.tanggalMulai).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            s/d{' '}
                            {new Date(ev.tanggalSelesai).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[150px]">{ev.lokasi}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="w-32">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                              <span>
                                {ev.terisi} / {ev.kuota}
                              </span>
                              <span>{pct}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  pct >= 100 ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {ev.syaratKurasi ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                              <FileCheck className="w-3 h-3" /> Wajib Terkurasi
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-400">Terbuka Umum</span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Badge status={ev.status} />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs gap-1"
                              onClick={() => openParticipants(ev)}
                            >
                              <Users className="w-3.5 h-3.5" />
                              <span>Peserta</span>
                            </Button>

                            {ev.status === 'draf' && (
                              <Button
                                variant="primary"
                                size="sm"
                                className="text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 border-none"
                                onClick={() => handlePublish(ev._id)}
                              >
                                <span>Publikasikan</span>
                              </Button>
                            )}

                            {ev.status === 'dibuka' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                                onClick={() => handleCloseEvent(ev._id)}
                              >
                                <span>Tutup</span>
                              </Button>
                            )}
                          </div>
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

      {/* Modal Buat Event Baru */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Agenda Event & Pelatihan Baru"
        size="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Agenda Event <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Contoh: Pameran Hari Koperasi (Harkop) Kab. Lebak 2026"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Event <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.jenis}
                onChange={(e) => setFormData({ ...formData, jenis: e.target.value })}
                className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-navy-900"
              >
                <option value="pameran">Pameran / Expo Dagang</option>
                <option value="pelatihan">Pelatihan & Sosialisasi</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lokasi Pelaksanaan <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Contoh: Alun-Alun Rangkasbitung / Plaza Lebak"
                value={formData.lokasi}
                onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={formData.tanggalMulai}
                onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Selesai <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={formData.tanggalSelesai}
                onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Akhir / Tenggat Pendaftaran <span className="text-rose-500">*</span>
              </label>
              <Input
                type="date"
                required
                value={formData.tenggatDaftar}
                onChange={(e) => setFormData({ ...formData, tenggatDaftar: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kapasitas Stan / Kuota Peserta <span className="text-rose-500">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max="1000"
                required
                value={formData.kuota}
                onChange={(e) => setFormData({ ...formData, kuota: e.target.value })}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Lengkap</label>
              <textarea
                rows={3}
                placeholder="Informasi detail mengenai fasilitas stan, agenda, atau kriteria produk..."
                value={formData.deskripsi}
                onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-navy-900"
              />
            </div>

            <div className="md:col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.syaratKurasi}
                  onChange={(e) => setFormData({ ...formData, syaratKurasi: e.target.checked })}
                  className="rounded border-slate-300 text-navy-900 focus:ring-navy-900"
                />
                <span className="text-xs font-semibold text-slate-700">
                  Wajibkan produk UMKM berstatus Terkurasi Dinas (Grade A/B)
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={formSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={formSubmitting}>
              {formSubmitting ? 'Menyimpan...' : 'Simpan Draf Event'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Daftar Peserta Stan */}
      <Modal
        isOpen={isPesertaModalOpen}
        onClose={() => setIsPesertaModalOpen(false)}
        title={`Daftar Peserta Stan: ${selectedEvent?.nama || ''}`}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <p className="text-xs text-slate-500">
                Alokasi Stan:{' '}
                <strong>
                  {selectedEvent?.terisi} dari {selectedEvent?.kuota} terisi
                </strong>
              </p>
              <p className="text-xs text-slate-500">
                Lokasi: <strong>{selectedEvent?.lokasi}</strong>
              </p>
            </div>

            {selectedEvent && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => handleExportParticipants(selectedEvent._id)}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Unduh Rekapitulasi (.xlsx)</span>
              </Button>
            )}
          </div>

          {loadingParticipants ? (
            <div className="py-8 text-center text-slate-400 text-xs">Memuat daftar peserta...</div>
          ) : participants.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Belum ada UMKM yang mendaftar stan untuk event ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Unit Usaha & Pemilik</th>
                    <th className="px-4 py-2.5">Kecamatan</th>
                    <th className="px-4 py-2.5">Produk Stan</th>
                    <th className="px-4 py-2.5">Status Stan</th>
                    <th className="px-4 py-2.5 text-right">Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {participants.map((reg) => (
                    <tr key={reg._id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-bold text-navy-900">
                          {reg.businessId?.namaUsaha || 'Usaha UMKM'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {reg.userId?.nama} &bull; {reg.userId?.noHp}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-700">
                          {reg.businessId?.kecamatan || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {reg.productId ? (
                          <div>
                            <p className="font-semibold text-slate-800">{reg.productId.nama}</p>
                            <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">
                              {reg.productId.statusKurasi}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge status={reg.status} />
                        {reg.catatan && (
                          <p className="text-[10px] text-slate-400 mt-1 italic">
                            &quot;{reg.catatan}&quot;
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {reg.status === 'menunggu_verifikasi' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="primary"
                              size="sm"
                              className="text-[11px] px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700"
                              onClick={() => {
                                setVerifTarget(reg);
                                setVerifAction('setuju');
                              }}
                            >
                              Setujui
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-[11px] px-2.5 py-1 text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => {
                                setVerifTarget(reg);
                                setVerifAction('tolak');
                              }}
                            >
                              Tolak
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Selesai</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Konfirmasi Verifikasi Peserta */}
      <Modal
        isOpen={!!verifTarget}
        onClose={() => setVerifTarget(null)}
        title={verifAction === 'setuju' ? 'Setujui Pendaftaran Stan' : 'Tolak Pendaftaran Stan'}
        size="sm"
      >
        <form onSubmit={handleVerifikasiParticipant} className="space-y-4">
          <p className="text-xs text-slate-600">
            {verifAction === 'setuju'
              ? `Konfirmasi persetujuan stan untuk unit usaha "${verifTarget?.businessId?.namaUsaha}". Peserta akan resmi terdaftar.`
              : `Tolak pendaftaran stan "${verifTarget?.businessId?.namaUsaha}". Kursi stan akan otomatis dikembalikan ke kuota umum.`}
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan untuk Pelaku Usaha (Opsional)
            </label>
            <textarea
              rows={3}
              placeholder={
                verifAction === 'setuju'
                  ? 'Contoh: Nomor stan B-12, wajib hadir technical meeting tanggal 10.'
                  : 'Contoh: Kuota stan untuk komoditas pangan telah penuh.'
              }
              value={verifCatatan}
              onChange={(e) => setVerifCatatan(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-navy-900"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setVerifTarget(null)}
              disabled={verifSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className={verifAction === 'setuju' ? 'bg-emerald-600' : 'bg-rose-600'}
              disabled={verifSubmitting}
            >
              {verifSubmitting
                ? 'Memproses...'
                : verifAction === 'setuju'
                ? 'Setujui Stan'
                : 'Tolak Pendaftaran'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default EventDinasPage;
