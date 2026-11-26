// ============================================================================
// Halaman Publik: Jadwal Event & Pameran Daerah
// [PBI-12] AC-12-14: Event dapat dilihat publik tanpa login
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, FileCheck, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../../services/api.js';
import { PublicNavbar } from '../../layouts/PublicNavbar.jsx';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';

export function EventPublikPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicEvents();
  }, []);

  const fetchPublicEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/events/publik');
      setEvents(res.data?.items || res.data || []);
    } catch (err) {
      console.warn('Gagal memuat event publik:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />
      {/* Header Publik */}
      <header className="bg-navy-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-navy-800">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
              Pemerintah Kabupaten Lebak
            </span>
            <h1 className="text-3xl font-black text-white">
              Agenda Event & Pameran UMKM Daerah
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Jadwal expo promosi produk unggulan dan pelatihan kemitraan Dinas Koperasi & UMKM Kabupaten Lebak.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/katalog"
              className="inline-flex items-center justify-center font-semibold transition-all duration-150 px-4 py-2 text-xs rounded-lg border border-white/30 text-white hover:bg-white/10 hover:border-white/50 whitespace-nowrap shadow-xs"
            >
              Katalog Produk
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center font-bold transition-all duration-150 px-4 py-2 text-xs rounded-lg bg-amber-500 hover:bg-amber-400 text-navy-950 shadow-xs whitespace-nowrap"
            >
              Masuk / Daftar Akun
            </Link>
          </div>
        </div>
      </header>

      {/* Konten Daftar Event */}
      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            Memuat jadwal pameran daerah...
          </div>
        ) : events.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-700">Belum Ada Agenda Terbuka</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Saat ini belum ada agenda pameran yang dibuka untuk pendaftaran. Nantikan informasi kegiatan resmi dari Dinas Koperasi & UMKM Lebak.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((ev) => (
              <Card key={ev._id} className="flex flex-col justify-between overflow-hidden">
                <CardHeader className="p-6 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        ev.jenis === 'pameran'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {ev.jenis === 'pameran' ? 'Expo Promosi' : 'Pelatihan & Sosialisasi'}
                    </span>
                    {ev.syaratKurasi && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> Wajib Terkurasi
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-navy-900 text-lg leading-snug">
                    {ev.nama}
                  </h3>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                    {ev.deskripsi || 'Kegiatan fasilitasi promosi produk UMKM Kabupaten Lebak.'}
                  </p>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-4">
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
                        Tenggat pendaftaran:{' '}
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

                  <div className="pt-2">
                    <Link to="/login">
                      <Button variant="primary" className="w-full text-xs gap-1.5">
                        <span>Masuk untuk Mendaftar Stan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default EventPublikPage;
