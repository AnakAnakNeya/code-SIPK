// ============================================================================
// [PBI-13] Halaman Forum Komunitas & Tanya Jawab (frontend/src/pages/forum/ForumPage.jsx)
// PIC: Abdullah | Ruang Diskusi UMKM, Fasilitasi Konsultan, & Pengumuman Dinas
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Pin,
  CheckCircle2,
  Search,
  Filter,
  PlusCircle,
  Clock,
  User,
  ShieldCheck,
  Send,
  Trash2,
  Building2,
  Tag,
  AlertCircle,
} from 'lucide-react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, CardHeader, CardContent } from '../../components/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';

const KATEGORI_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'pengumuman_dinas', label: 'Pengumuman Resmi Dinas' },
  { value: 'legalitas_perizinan', label: 'Legalitas & Perizinan (NIB, P-IRT, Halal)' },
  { value: 'kemasan', label: 'Desain & Rumah Kemasan Sintesa' },
  { value: 'bahan_baku', label: 'Pasokan Bahan Baku Lokal' },
  { value: 'kolaborasi_pasokan', label: 'Kolaborasi Kuota & RFQ' },
  { value: 'umum', label: 'Diskusi Umum Wirausaha' },
];

export function ForumPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKategori, setSelectedKategori] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Buat Thread
  const [modalCreateOpen, setModalCreateOpen] = useState(false);
  const [newJudul, setNewJudul] = useState('');
  const [newKategori, setNewKategori] = useState('umum');
  const [newIsi, setNewIsi] = useState('');
  const [submittingThread, setSubmittingThread] = useState(false);

  // Modal Detail Thread & Balasan
  const [activeThread, setActiveThread] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchThreads = async () => {
    try {
      const res = await api.get('/forum/threads', {
        params: {
          kategori: selectedKategori || undefined,
          q: searchQuery || undefined,
        },
      });
      setThreads(res.data.data?.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [selectedKategori]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchThreads();
  };

  const handleOpenThread = async (thread) => {
    setActiveThread(thread);
    setLoadingPosts(true);
    setReplyText('');
    try {
      const res = await api.get(`/forum/threads/${thread._id}`);
      setPosts(res.data.data?.posts || []);
    } catch (err) {
      alert('Gagal memuat balasan diskusi');
    } finally {
      setLoadingPosts(false);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    setSubmittingThread(true);
    try {
      await api.post('/forum/threads', {
        judul: newJudul,
        kategori: newKategori,
        isi: newIsi,
      });
      alert('Topik diskusi baru berhasil diterbitkan!');
      setModalCreateOpen(false);
      setNewJudul('');
      setNewIsi('');
      fetchThreads();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal menerbitkan topik');
    } finally {
      setSubmittingThread(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await api.post(`/forum/threads/${activeThread._id}/posts`, {
        isi: replyText,
      });
      setPosts([...posts, res.data.data]);
      setReplyText('');
      fetchThreads();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal mengirim balasan');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handlePinThread = async (threadId) => {
    try {
      await api.post(`/forum/threads/${threadId}/sematkan`);
      fetchThreads();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal menyematkan topik');
    }
  };

  const handleUnpinThread = async (threadId) => {
    try {
      await api.post(`/forum/threads/${threadId}/lepas-sematan`);
      fetchThreads();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal melepas sematan');
    }
  };

  const handleMarkOfficialAnswer = async (postId) => {
    try {
      await api.post(`/forum/posts/${postId}/jawaban-resmi`);
      // Update local state
      setPosts(
        posts.map((p) => ({
          ...p,
          jawabanResmi: p._id === postId,
        }))
      );
      fetchThreads();
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Gagal menandai jawaban resmi');
    }
  };

  const isDinas = ['staf', 'kabid'].includes(user?.role);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
            <MessageSquare className="w-4 h-4" />
            <span>Pusat Tanya Jawab & Komunitas UMKM Lebak</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Forum Komunitas & Konsultasi UMKM</h1>
          <p className="text-sm text-slate-300">
            Berbagi pengalaman izin usaha, pasokan bahan baku, kemasan, dan dapatkan jawaban resmi langsung dari fasilitator Dinas Koperasi & UKM.
          </p>
        </div>

        <Button
          onClick={() => setModalCreateOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold shrink-0 shadow-lg"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Mulai Diskusi Baru
        </Button>
      </div>

      {/* Filter Kategori & Pencarian */}
      <Card className="p-4 bg-white">
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari topik diskusi, pertanyaan izin, bahan baku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
            />
          </form>

          <div className="sm:w-72">
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
            >
              {KATEGORI_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Daftar Topik Thread */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400">Memuat topik forum...</div>
        ) : threads.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-xl border border-dashed border-slate-200 space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Belum Ada Topik Diskusi</p>
            <p className="text-xs text-slate-400">Jadilah yang pertama memulai diskusi atau bertanya ke dinas!</p>
          </div>
        ) : (
          threads.map((t) => (
            <Card
              key={t._id}
              onClick={() => handleOpenThread(t)}
              className={`p-5 cursor-pointer hover:shadow-md transition ${
                t.pinned ? 'border-2 border-navy-900 bg-slate-50/40' : ''
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {t.pinned && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-navy-950 text-white px-2 py-0.5 rounded">
                        <Pin className="w-3 h-3 fill-current" />
                        Disematkan
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {KATEGORI_OPTIONS.find((k) => k.value === t.kategori)?.label || t.kategori}
                    </span>
                    {t.terjawabDinas && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Terjawab oleh Dinas
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 hover:text-navy-900">
                    {t.judul}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {t.isi}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span className="font-semibold text-slate-700">{t.authorNama}</span>
                    <span>Kec. {t.authorKecamatan}</span>
                    <span>
                      {new Date(t.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center sm:flex-col sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 gap-2 shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-navy-900 bg-slate-100 px-3 py-1.5 rounded-lg">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>{t.replyCount || 0} Balasan</span>
                  </div>

                  {isDinas && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {t.pinned ? (
                        <button
                          onClick={() => handleUnpinThread(t._id)}
                          className="text-[10px] text-slate-500 hover:text-red-600 underline"
                        >
                          Lepas Sematan
                        </button>
                      ) : (
                        <button
                          onClick={() => handlePinThread(t._id)}
                          className="text-[10px] text-navy-900 hover:text-amber-600 underline font-semibold"
                        >
                          Sematkan
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Mulai Diskusi Baru */}
      <Modal
        isOpen={modalCreateOpen}
        onClose={() => setModalCreateOpen(false)}
        title="Mulai Topik Diskusi Baru"
        size="lg"
        footer={
          <div className="flex justify-end gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setModalCreateOpen(false)}>
              Batal
            </Button>
            <Button
              size="sm"
              disabled={submittingThread}
              onClick={handleCreateThread}
              className="bg-navy-900 hover:bg-navy-800 text-white"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Terbitkan Topik
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateThread} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Kategori Diskusi:</label>
            <select
              value={newKategori}
              onChange={(e) => setNewKategori(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500"
            >
              {KATEGORI_OPTIONS.filter((k) => k.value).map((opt) => {
                if (opt.value === 'pengumuman_dinas' && !isDinas) return null;
                return (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Judul Topik Diskusi:</label>
            <input
              type="text"
              placeholder="Contoh: Berapa lama waktu pengujian umur simpan untuk olahan pangan di Lab Lebak?"
              value={newJudul}
              onChange={(e) => setNewJudul(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Isi Pertanyaan / Penjelasan Lengkap:</label>
            <textarea
              rows="5"
              placeholder="Ceritakan detail kendala atau informasi yang ingin Anda diskusikan..."
              value={newIsi}
              onChange={(e) => setNewIsi(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>
        </form>
      </Modal>

      {/* Modal Detail Thread & Balasan */}
      {activeThread && (
        <Modal
          isOpen={true}
          onClose={() => setActiveThread(null)}
          title={activeThread.judul}
          size="xl"
        >
          <div className="space-y-6 text-xs">
            {/* Topik Utama */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-navy-950">{activeThread.authorNama}</span>
                <span className="text-slate-400">
                  {new Date(activeThread.createdAt).toLocaleString('id-ID')}
                </span>
              </div>
              <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{activeThread.isi}</p>
            </div>

            {/* Daftar Balasan */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide">
                Balasan Diskusi ({posts.length}):
              </h4>

              {loadingPosts ? (
                <p className="text-slate-400 py-4 text-center">Memuat balasan...</p>
              ) : posts.length === 0 ? (
                <p className="text-slate-400 py-4 text-center bg-slate-50 rounded-lg">
                  Belum ada balasan pada topik ini. Jadilah yang pertama menjawab!
                </p>
              ) : (
                posts.map((p) => (
                  <div
                    key={p._id}
                    className={`p-4 rounded-xl border space-y-2 ${
                      p.jawabanResmi
                        ? 'bg-emerald-50/70 border-emerald-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{p.authorNama}</span>
                        {p.jawabanResmi && (
                          <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Jawaban Resmi Dinas
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400">
                        {new Date(p.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{p.isi}</p>

                    {isDinas && !p.jawabanResmi && (
                      <div className="pt-1 flex justify-end">
                        <button
                          onClick={() => handleMarkOfficialAnswer(p._id)}
                          className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
                        >
                          Tandai Sebagai Jawaban Resmi Dinas
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Form Kirim Balasan */}
            <form onSubmit={handleSendReply} className="space-y-2 pt-2 border-t border-slate-200">
              <label className="font-semibold text-slate-700 block text-xs">Tuliskan Balasan Anda:</label>
              <textarea
                rows="3"
                placeholder="Tuliskan tanggapan atau informasi solusi Anda..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  type="submit"
                  disabled={submittingReply || !replyText.trim()}
                  className="bg-navy-900 hover:bg-navy-800 text-white"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Kirim Balasan
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default ForumPage;
