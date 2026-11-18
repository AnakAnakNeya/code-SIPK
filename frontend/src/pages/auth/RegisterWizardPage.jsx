import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, ArrowLeft, ArrowRight, ShieldCheck, Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';
import { KECAMATAN } from '../../constants/kecamatan.js';

export function RegisterWizardPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subKomoditasInput, setSubKomoditasInput] = useState('');

  // Form State disimpan di level komponen induk agar tidak hilang saat menekan 'Kembali' (AC-01-01)
  const [formData, setFormData] = useState({
    // Langkah 1: Pemilik
    nama: '',
    email: '',
    noHp: '',
    password: '',
    confirmPassword: '',

    // Langkah 2: Usaha
    namaUsaha: '',
    kecamatan: 'Rangkasbitung',
    tahunMulai: new Date().getFullYear(),
    alamat: '',
    waUsaha: '',
    nib: '',

    // Langkah 3: Komoditas
    kategoriUtama: 'olahan_pangan',
    subKomoditas: ['Gula Aren Semut'],
    pernyataanBenar: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const addSubKomoditas = () => {
    const item = subKomoditasInput.trim();
    if (!item) return;
    if (formData.subKomoditas.includes(item)) return;
    if (formData.subKomoditas.length >= 5) return;
    setFormData((prev) => ({
      ...prev,
      subKomoditas: [...prev.subKomoditas, item],
    }));
    setSubKomoditasInput('');
  };

  const removeSubKomoditas = (item) => {
    setFormData((prev) => ({
      ...prev,
      subKomoditas: prev.subKomoditas.filter((k) => k !== item),
    }));
  };

  // Validasi Langkah 1
  const validateStep1 = () => {
    if (!formData.nama || formData.nama.length < 3) return 'Nama pemilik minimal 3 karakter';
    if (!formData.email || !/^\S+@\S+\.\S+$/.test(formData.email)) return 'Email tidak valid';
    if (!formData.noHp || !/^(\+62|62|0)8\d{8,11}$/.test(formData.noHp)) return 'Nomor HP tidak valid (contoh: 081234567890)';
    if (!formData.password || formData.password.length < 8) return 'Kata sandi minimal 8 karakter';
    if (!/[A-Za-z]/.test(formData.password) || !/\d/.test(formData.password)) return 'Kata sandi harus mengandung huruf dan angka';
    if (formData.password !== formData.confirmPassword) return 'Konfirmasi kata sandi tidak cocok';
    return null;
  };

  // Validasi Langkah 2
  const validateStep2 = () => {
    if (!formData.namaUsaha || formData.namaUsaha.length < 3) return 'Nama usaha minimal 3 karakter';
    if (!formData.kecamatan) return 'Pilih kecamatan sentra usaha';
    if (!formData.tahunMulai || formData.tahunMulai < 1950 || formData.tahunMulai > new Date().getFullYear()) {
      return `Tahun mulai usaha harus antara 1950 dan ${new Date().getFullYear()}`;
    }
    if (!formData.alamat || formData.alamat.length < 10) return 'Alamat sentra usaha minimal 10 karakter';
    if (!formData.waUsaha) return 'Nomor WhatsApp usaha wajib diisi';
    if (!formData.nib || !/^\d{13}$/.test(formData.nib.trim())) return 'NIB harus tepat 13 digit angka sesuai OSS-RBA';
    return null;
  };

  // Validasi Langkah 3 & Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.subKomoditas.length === 0) {
      setError('Masukkan minimal 1 produk/sub-komoditas unggulan');
      return;
    }
    if (!formData.pernyataanBenar) {
      setError('Anda wajib mencentang pernyataan kebenaran data');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        nama: formData.nama.trim(),
        email: formData.email.trim().toLowerCase(),
        noHp: formData.noHp.trim(),
        password: formData.password,
        namaUsaha: formData.namaUsaha.trim(),
        kecamatan: formData.kecamatan,
        tahunMulai: Number(formData.tahunMulai),
        alamat: formData.alamat.trim(),
        waUsaha: formData.waUsaha.trim(),
        nib: formData.nib.trim(),
        kategoriUtama: formData.kategoriUtama,
        subKomoditas: formData.subKomoditas,
        pernyataanBenar: true,
      };

      await register(payload);
      navigate('/umkm/dasbor');
    } catch (err) {
      setError(err.message || 'Pendaftaran gagal. Periksa kembali isian Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) return setError(err);
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) return setError(err);
      setStep(3);
    }
  };

  return (
    <AuthLayout
      title="Pendaftaran Akun Pelaku UMKM"
      subtitle="Daftarkan usaha Anda secara mandiri untuk kurasi resmi Pemkab Lebak."
    >
      {/* Indikator Wizard 3 Langkah (AC-01-01) */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
          <span className={step >= 1 ? 'text-navy-900 font-extrabold' : ''}>1. Data Pemilik</span>
          <span className={step >= 2 ? 'text-navy-900 font-extrabold' : ''}>2. Profil Usaha</span>
          <span className={step >= 3 ? 'text-navy-900 font-extrabold' : ''}>3. Komoditas & Izin</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className={`h-2 rounded-full transition-all ${step >= 1 ? 'bg-navy-900' : 'bg-slate-200'}`} />
          <div className={`h-2 rounded-full transition-all ${step >= 2 ? 'bg-navy-900' : 'bg-slate-200'}`} />
          <div className={`h-2 rounded-full transition-all ${step >= 3 ? 'bg-navy-900' : 'bg-slate-200'}`} />
        </div>
      </div>

      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      {/* LANGKAH 1: DATA PEMILIK */}
      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Nama Lengkap Pemilik Sesuai KTP"
            name="nama"
            required
            placeholder="contoh: Sarmi"
            value={formData.nama}
            onChange={handleChange}
          />
          <Input
            label="Alamat Email Aktif"
            name="email"
            type="email"
            required
            placeholder="nama@contoh.com"
            value={formData.email}
            onChange={handleChange}
          />
          <Input
            label="Nomor HP Pemilik (Aktif WhatsApp)"
            name="noHp"
            required
            placeholder="081234567890"
            helperText="Digunakan untuk notifikasi dan pemulihan akun"
            value={formData.noHp}
            onChange={handleChange}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Kata Sandi"
              name="password"
              type="password"
              required
              placeholder="Minimal 8 karakter"
              value={formData.password}
              onChange={handleChange}
            />
            <Input
              label="Ulangi Kata Sandi"
              name="confirmPassword"
              type="password"
              required
              placeholder="Ulangi sandi"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primary" onClick={handleNext} className="gap-2">
              <span>Lanjut ke Profil Usaha</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* LANGKAH 2: DATA USAHA */}
      {step === 2 && (
        <div className="space-y-4">
          <Input
            label="Nama Unit Usaha / Jenama"
            name="namaUsaha"
            required
            placeholder="contoh: Tenun Ambu Kanekes"
            value={formData.namaUsaha}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Kecamatan Sentra Usaha"
              name="kecamatan"
              required
              value={formData.kecamatan}
              onChange={handleChange}
            >
              {KECAMATAN.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>

            <Input
              label="Tahun Mulai Beroperasi"
              name="tahunMulai"
              type="number"
              required
              value={formData.tahunMulai}
              onChange={handleChange}
            />
          </div>

          <Input
            label="Alamat Lengkap Sentra / Rumah Produksi"
            name="alamat"
            required
            placeholder="Kampung / Jalan, RT/RW, Desa / Kelurahan"
            value={formData.alamat}
            onChange={handleChange}
          />

          <Input
            label="Nomor WhatsApp Usaha / Pemasaran"
            name="waUsaha"
            required
            placeholder="081234567890"
            helperText="Nomor ini akan tampil di katalog untuk dihubungi mitra pembeli"
            value={formData.waUsaha}
            onChange={handleChange}
          />

          <Input
            label="Nomor Induk Berusaha (NIB)"
            name="nib"
            required
            placeholder="13 digit angka"
            helperText="13 digit angka sesuai izin OSS-RBA (tanpa spasi/tanda hubung)"
            value={formData.nib}
            onChange={handleChange}
          />

          <div className="pt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </Button>
            <Button variant="primary" onClick={handleNext} className="gap-2">
              <span>Lanjut ke Komoditas</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* LANGKAH 3: KOMODITAS & PERNYATAAN */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Kategori Utama Komoditas"
            name="kategoriUtama"
            required
            value={formData.kategoriUtama}
            onChange={handleChange}
          >
            <option value="olahan_pangan">Olahan Pangan (Gula Aren, Keripik, Kopi, dsb)</option>
            <option value="kriya_tenun">Kriya & Tenun (Tenun Baduy, Anyaman, dsb)</option>
          </Select>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Sub-Komoditas / Produk Utama (Maksimal 5) <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="contoh: Gula Aren Cetak, Tenun Motif Suat"
                value={subKomoditasInput}
                onChange={(e) => setSubKomoditasInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubKomoditas();
                  }
                }}
                className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
              <Button type="button" variant="outline" onClick={addSubKomoditas} size="sm">
                <Plus className="w-4 h-4 mr-1" /> Tambah
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.subKomoditas.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy-50 text-navy-900 border border-navy-200"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => removeSubKomoditas(item)}
                    className="hover:text-rose-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              <span>Unggah Dokumen Berkas</span>
            </div>
            <p>
              Salinan fisik berkas NIB dan perizinan opsional (SPP-IRT, Halal) diunggah setelah akun Anda
              berhasil dibuat melalui menu <strong>Profil Usaha & Legalitas</strong>.
            </p>
          </div>

          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="pernyataanBenar"
                checked={formData.pernyataanBenar}
                onChange={handleChange}
                className="mt-1 rounded border-slate-300 text-navy-900 focus:ring-navy-900"
              />
              <span className="text-xs text-slate-700 leading-relaxed">
                Saya menyatakan dengan sungguh-sungguh bahwa seluruh data usaha, perizinan, dan alamat sentra
                yang saya masukkan adalah benar dan dapat dipertanggungjawabkan kepada Dinas Koperasi & UMKM
                Kabupaten Lebak. <span className="text-rose-500">*</span>
              </span>
            </label>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </Button>
            <Button
              type="submit"
              variant="secondary"
              loading={loading}
              disabled={!formData.pernyataanBenar}
              className="font-bold gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Selesaikan dan Ajukan Akun</span>
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 pt-6 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600">
          Sudah memiliki akun usaha?{' '}
          <Link to="/login" className="font-bold text-navy-900 hover:text-amber-600 transition">
            Masuk di sini
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
export default RegisterWizardPage;
