// ============================================================================
// [PBI-01 & PBI-02] Profil Usaha (FR-01) & Unggah Berkas Legalitas (FR-02)
// PIC: Naila (PBI-01) & Abdullah (PBI-02)
// Kriteria:
// - AC-01-16: UMKM boleh mengubah nama/alamat usaha, NIB terkunci demi integritas OSS-RBA
// - AC-02-01 s/d AC-02-05: Unggah berkas NIB, SPP-IRT, Halal, Uji Umur Simpan, HKI (maks 2 MB)
// - AC-02-10: Badge status verifikasi dinas (Valid, Perlu Revisi, Belum Diperiksa)
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { KECAMATAN } from '../../constants/kecamatan.js';

export function ProfilUsahaPage() {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileErr, setProfileErr] = useState(null);

  // Profil Form State
  const [profile, setProfile] = useState({
    namaUsaha: '',
    kecamatan: 'Rangkasbitung',
    alamat: '',
    tahunMulai: 2020,
    waUsaha: '',
    nib: '',
    kategoriUtama: 'olahan_pangan',
    subKomoditas: [],
  });

  // Dokumen State
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedJenis, setSelectedJenis] = useState('nib');
  const [docNomor, setDocNomor] = useState('');
  const [masaBerlaku, setMasaBerlaku] = useState('');
  const [masaSimpanBulan, setMasaSimpanBulan] = useState(12);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadErr, setUploadErr] = useState(null);

  // Fetch Profil & Dokumen
  const loadData = async () => {
    try {
      const res = await api.get('/profil/saya');
      if (res.data) {
        setProfile({
          namaUsaha: res.data.namaUsaha || '',
          kecamatan: res.data.kecamatan || 'Rangkasbitung',
          alamat: res.data.alamat || '',
          tahunMulai: res.data.tahunMulai || 2020,
          waUsaha: res.data.waUsaha || '',
          nib: res.data.nib || '',
          kategoriUtama: res.data.kategoriUtama || 'olahan_pangan',
          subKomoditas: res.data.subKomoditas || [],
        });
      }
    } catch (err) {
      setProfileErr(err.message);
    }

    try {
      setDocLoading(true);
      const resDocs = await api.get('/documents/mine');
      setDocuments(resDocs.data || []);
    } catch {
      // ignore
    } finally {
      setDocLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileErr(null);
    setProfileMsg(null);
    setLoading(true);

    try {
      const res = await api.put('/profil/saya', {
        namaUsaha: profile.namaUsaha,
        kecamatan: profile.kecamatan,
        alamat: profile.alamat,
        tahunMulai: Number(profile.tahunMulai),
        waUsaha: profile.waUsaha,
        subKomoditas: profile.subKomoditas,
      });
      setProfileMsg('Perubahan profil usaha berhasil disimpan.');
      await refreshUser();
    } catch (err) {
      setProfileErr(err.message || 'Gagal menyimpan profil usaha');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    setUploadErr(null);

    if (!fileToUpload) {
      setUploadErr('Pilih berkas dokumen PDF atau JPG/PNG terlebih dahulu');
      return;
    }

    const formData = new FormData();
    formData.append('file', fileToUpload);
    formData.append('jenis', selectedJenis);
    if (docNomor) formData.append('nomor', docNomor);
    if (masaBerlaku) formData.append('masaBerlaku', masaBerlaku);
    if (selectedJenis === 'uji_umur_simpan') formData.append('masaSimpanBulan', masaSimpanBulan);

    try {
      await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadModalOpen(false);
      setFileToUpload(null);
      setDocNomor('');
      loadData();
    } catch (err) {
      setUploadErr(err.message || 'Gagal mengunggah berkas');
    }
  };

  const getDoc = (jenis) => documents.find((d) => d.jenis === jenis);

  const DOC_LIST =
    profile.kategoriUtama === 'kriya_tenun'
      ? [
          { jenis: 'nib', label: 'NIB (Nomor Induk Berusaha)', wajib: true },
          { jenis: 'hak_merek', label: 'Sertifikat HKI / Merek Dagang', wajib: false },
        ]
      : [
          { jenis: 'nib', label: 'NIB (Nomor Induk Berusaha)', wajib: true },
          { jenis: 'spp_irt', label: 'Sertifikat SPP-IRT', wajib: true },
          { jenis: 'halal', label: 'Sertifikat Halal (BPJPH)', wajib: true },
          { jenis: 'uji_umur_simpan', label: 'Hasil Uji Umur Simpan / Lab', wajib: true },
          { jenis: 'hak_merek', label: 'Sertifikat HKI / Merek Dagang', wajib: false },
        ];

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
          Pengaturan Usaha
        </span>
        <h1 className="text-2xl font-extrabold text-navy-900 mt-1">
          Profil Usaha & Kelengkapan Dokumen
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Kelola data sentra usaha dan unggah berkas legalitas untuk kurasi dinas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Form Profil Usaha (AC-01-16) */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader
              title="Informasi Unit Usaha"
              description="Data alamat dan kontak yang ditampilkan pada direktori binaan dinas"
            />
            <form onSubmit={handleProfileSubmit}>
              <CardContent className="space-y-4">
                {profileMsg && <Alert type="success">{profileMsg}</Alert>}
                {profileErr && <Alert type="error">{profileErr}</Alert>}

                <Input
                  label="Nama Unit Usaha"
                  required
                  value={profile.namaUsaha}
                  onChange={(e) => setProfile({ ...profile, namaUsaha: e.target.value })}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Kecamatan Sentra"
                    required
                    value={profile.kecamatan}
                    onChange={(e) => setProfile({ ...profile, kecamatan: e.target.value })}
                  >
                    {KECAMATAN.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Tahun Mulai Beroperasi"
                    type="number"
                    required
                    value={profile.tahunMulai}
                    onChange={(e) => setProfile({ ...profile, tahunMulai: e.target.value })}
                  />
                </div>

                <Input
                  label="Alamat Sentra / Rumah Produksi"
                  required
                  value={profile.alamat}
                  onChange={(e) => setProfile({ ...profile, alamat: e.target.value })}
                />

                <Input
                  label="WhatsApp Usaha / Pemasaran"
                  required
                  value={profile.waUsaha}
                  onChange={(e) => setProfile({ ...profile, waUsaha: e.target.value })}
                />

                {/* NIB Terkunci: Hanya Dinas yang berhak mengubah (AC-01-16) */}
                <div>
                  <Input
                    label="Nomor Induk Berusaha (NIB)"
                    value={profile.nib}
                    disabled
                    helperText="NIB terkunci demi integritas perizinan OSS-RBA. Hubungi dinas bila ada perubahan NIB."
                    className="opacity-80"
                  />
                </div>
              </CardContent>

              <CardFooter className="justify-end">
                <Button type="submit" variant="primary" loading={loading} className="font-bold">
                  Simpan Perubahan Profil
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>

        {/* Kolom Kanan: Dokumen Izin Usaha (PBI-02) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader
              title="Dokumen Legalitas Izin"
              description="Unggah salinan PDF atau JPG/PNG (maksimal 2 MB)"
            />
            <CardContent className="space-y-3">
              {DOC_LIST.map((item) => {
                const doc = getDoc(item.jenis);
                return (
                  <div
                    key={item.jenis}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-3 hover:border-slate-300 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-navy-900 truncate">
                          {item.label}
                        </span>
                        {item.wajib && (
                          <span className="text-[10px] text-rose-500 font-semibold">*wajib</span>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-2">
                        {doc ? (
                          <>
                            <Badge status={doc.statusVerifikasi} size="sm" />
                            {doc.file?.namaAsli && (
                              <a
                                href={`/api/v1/documents/${doc.id}/file`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] text-navy-900 hover:underline flex items-center gap-1 truncate max-w-[120px]"
                              >
                                <FileText className="w-3 h-3 shrink-0" />
                                <span className="truncate">{doc.file.namaAsli}</span>
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Belum diunggah</span>
                        )}
                      </div>

                      {doc?.catatan && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 p-1.5 rounded mt-1.5">
                          Catatan dinas: {doc.catatan}
                        </p>
                      )}
                    </div>

                    <Button
                      variant={doc ? 'outline' : 'secondary'}
                      size="sm"
                      onClick={() => {
                        setSelectedJenis(item.jenis);
                        setDocNomor(doc?.nomor || (item.jenis === 'nib' ? profile.nib : ''));
                        setUploadErr(null);
                        setUploadModalOpen(true);
                      }}
                    >
                      <Upload className="w-3.5 h-3.5 mr-1" />
                      <span>{doc ? 'Ubah' : 'Unggah'}</span>
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal Unggah Dokumen */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-navy-900">
              Unggah Dokumen: {selectedJenis.toUpperCase()}
            </h3>

            {uploadErr && <Alert type="error">{uploadErr}</Alert>}

            <form onSubmit={handleUploadDoc} className="space-y-4">
              <Input
                label="Nomor Dokumen / Sertifikat"
                required
                value={docNomor}
                onChange={(e) => setDocNomor(e.target.value)}
                placeholder={selectedJenis === 'nib' ? '13 digit NIB' : 'Nomor registrasi resmi'}
              />

              {['halal', 'spp_irt'].includes(selectedJenis) && (
                <Input
                  label="Masa Berlaku Sampai"
                  type="date"
                  required
                  value={masaBerlaku}
                  onChange={(e) => setMasaBerlaku(e.target.value)}
                />
              )}

              {selectedJenis === 'uji_umur_simpan' && (
                <Input
                  label="Masa Simpan (Bulan)"
                  type="number"
                  min="1"
                  max="60"
                  required
                  value={masaSimpanBulan}
                  onChange={(e) => setMasaSimpanBulan(e.target.value)}
                />
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Pilih File Berkas (PDF atau JPG/PNG, maks 2 MB) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png"
                  required
                  onChange={(e) => setFileToUpload(e.target.files?.[0] || null)}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy-900 file:text-white hover:file:bg-navy-800"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" variant="primary">
                  Unggah Berkas
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
export default ProfilUsahaPage;
