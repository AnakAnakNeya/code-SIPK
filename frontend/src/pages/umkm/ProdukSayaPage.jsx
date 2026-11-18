// ============================================================================
// [PBI-03 & PBI-04] Produk Saya (FR-03) & Tombol Ajukan Kurasi (FR-04)
// PIC: Fariz (PBI-03) & Abdullah (PBI-04)
// Kriteria:
// - AC-03-01 s/d AC-03-07: Daftar tabel produk, pembuatan draf, penetapan kapasitas & harga acuan
// - AC-03-08 & AC-04-01: Tombol "Ajukan Kurasi" membuat nomor KUR-2026-xxx & kunci produk
// - AC-03-12: Hapus hanya berlaku untuk produk berstatus 'draf'
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Trash2,
  Send,
  Award,
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit,
} from 'lucide-react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert } from '../../components/ui/Alert.jsx';

export function ProdukSayaPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Modal Tambah Produk
  const [modalOpen, setModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formErr, setFormErr] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    subKomoditas: '',
    satuan: 'pak',
    hargaAcuan: 25000,
    kapasitasBulanan: 100,
    deskripsi: '',
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/products/mine');
      setProducts(res.data || []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormErr(null);
    if (!formData.nama || formData.nama.length < 5) {
      setFormErr('Nama produk minimal 5 karakter');
      return;
    }
    if (!formData.deskripsi || formData.deskripsi.length < 30) {
      setFormErr('Deskripsi keunggulan lokal minimal 30 karakter');
      return;
    }

    setFormLoading(true);
    try {
      await api.post('/products', {
        nama: formData.nama.trim(),
        subKomoditas: formData.subKomoditas.trim() || formData.nama.trim(),
        satuan: formData.satuan,
        hargaAcuan: Number(formData.hargaAcuan),
        kapasitasBulanan: Number(formData.kapasitasBulanan),
        deskripsi: formData.deskripsi.trim(),
      });
      setModalOpen(false);
      setFormData({
        nama: '',
        subKomoditas: '',
        satuan: 'pak',
        hargaAcuan: 25000,
        kapasitasBulanan: 100,
        deskripsi: '',
      });
      setMsg('Draf produk berhasil ditambahkan');
      loadProducts();
    } catch (e) {
      setFormErr(e.message || 'Gagal menyimpan produk');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Yakin ingin menghapus draf produk ini?')) return;
    try {
      await api.delete(`/products/${id}`);
      setMsg('Draf produk berhasil dihapus');
      loadProducts();
    } catch (e) {
      setErr(e.message || 'Gagal menghapus produk');
    }
  };

  const handleAjukanKurasi = async (id) => {
    if (user?.status !== 'aktif') {
      setErr('Akun Anda masih menunggu persetujuan dinas. Kurasi hanya bisa diajukan oleh akun aktif.');
      return;
    }
    if (!window.confirm('Ajukan produk ini ke tim verifikator Dinas Koperasi & UMKM Lebak?')) return;

    try {
      await api.post(`/products/${id}/ajukan-kurasi`);
      setMsg('Pengajuan kurasi berhasil dibuat! Tim dinas akan memeriksa berkas Anda.');
      loadProducts();
    } catch (e) {
      setErr(e.message || 'Gagal mengajukan kurasi');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Manajemen Komoditas
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-1">Produk Saya</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar produk usaha, penetapan kapasitas produksi, dan pengajuan kurasi mutu dinas.
          </p>
        </div>

        <Button variant="primary" onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </Button>
      </div>

      {msg && <Alert type="success" onClose={() => setMsg(null)}>{msg}</Alert>}
      {err && <Alert type="error" onClose={() => setErr(null)}>{err}</Alert>}

      {/* Tabel Produk (AC-03-01) */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
              <tr>
                <th className="p-4">Nama Produk</th>
                <th className="p-4">Kategori</th>
                <th className="p-4">Harga Acuan</th>
                <th className="p-4">Kapasitas</th>
                <th className="p-4">Status Kurasi</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-slate-400">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600">Belum ada produk yang didaftarkan</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Klik tombol "Tambah Produk Baru" untuk membuat draf produk pertama Anda.
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/80 transition">
                    <td className="p-4 font-bold text-navy-900">
                      <div>{p.nama}</div>
                      <span className="text-[11px] font-normal text-slate-400 block truncate max-w-xs">
                        {p.subKomoditas}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      {p.kategori === 'kriya_tenun' ? 'Kriya & Tenun' : 'Olahan Pangan'}
                    </td>
                    <td className="p-4 font-extrabold text-navy-900 font-mono">
                      Rp{p.hargaAcuan?.toLocaleString('id-ID')}
                      <span className="text-[11px] font-normal text-slate-400"> /{p.satuan}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      {p.kapasitasBulanan} {p.satuan}/bln
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <Badge status={p.statusKurasi} size="sm" />
                        {p.gradeKurasi && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-500 text-navy-950">
                            Grade {p.gradeKurasi}
                          </span>
                        )}
                      </div>
                      {p.nomorSK && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-1">
                          SK: {p.nomorSK}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      {p.statusKurasi === 'draf' && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAjukanKurasi(p._id)}
                            className="gap-1 font-bold"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Ajukan Kurasi</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(p._id)}
                            className="text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}

                      {p.statusKurasi === 'perlu_revisi' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleAjukanKurasi(p._id)}
                          className="gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Perbaiki & Ajukan Ulang</span>
                        </Button>
                      )}

                      {p.statusKurasi === 'terkurasi' && (
                        <span className="text-xs font-bold text-emerald-700 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Siap di Katalog
                        </span>
                      )}

                      {p.statusKurasi === 'menunggu_verifikasi' && (
                        <span className="text-xs text-amber-700 font-semibold inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> Dalam Antrean
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Tambah Produk (AC-03-02) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900">Tambah Draf Produk Baru</h3>

            {formErr && <Alert type="error">{formErr}</Alert>}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <Input
                label="Nama Produk Lengkap"
                required
                placeholder="contoh: Gula Aren Semut Organik 500g"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Sub-Komoditas / Varian"
                  placeholder="Gula Aren Semut"
                  value={formData.subKomoditas}
                  onChange={(e) => setFormData({ ...formData, subKomoditas: e.target.value })}
                />
                <Select
                  label="Satuan Produk"
                  required
                  value={formData.satuan}
                  onChange={(e) => setFormData({ ...formData, satuan: e.target.value })}
                >
                  <option value="pak">pak</option>
                  <option value="lembar">lembar</option>
                  <option value="botol">botol</option>
                  <option value="kemasan">kemasan</option>
                  <option value="kg">kg</option>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Harga Acuan (Rp)"
                  type="number"
                  min="1000"
                  required
                  value={formData.hargaAcuan}
                  onChange={(e) => setFormData({ ...formData, hargaAcuan: e.target.value })}
                />
                <Input
                  label="Kapasitas Produksi / Bulan"
                  type="number"
                  min="1"
                  required
                  value={formData.kapasitasBulanan}
                  onChange={(e) => setFormData({ ...formData, kapasitasBulanan: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Deskripsi Keunggulan Lokal (Minimal 30 karakter) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Jelaskan bahan baku asli Lebak, cara produksi higienis / tradisi..."
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary" loading={formLoading} className="font-bold">
                  Simpan Draf Produk
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProdukSayaPage;
