import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import api from '../../api/client.js';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setMsg(
        'Tautan instruksi pemulihan kata sandi telah dikirim ke alamat email Anda (berlaku 30 menit).',
      );
    } catch (e) {
      setErr(e.message || 'Gagal memproses pemulihan kata sandi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Lupa Kata Sandi"
      subtitle="Masukkan alamat email terdaftar Anda untuk menerima tautan pemulihan."
    >
      {msg ? (
        <div className="space-y-4">
          <Alert type="success">{msg}</Alert>
          <div className="pt-2 text-center">
            <Link to="/login" className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman Masuk
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {err && <Alert type="error">{err}</Alert>}

          <Input
            label="Alamat Email Terdaftar"
            type="email"
            required
            placeholder="nama@contoh.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="pt-2">
            <Button type="submit" variant="primary" loading={loading} className="w-full font-bold">
              Kirim Tautan Reset
            </Button>
          </div>

          <div className="pt-4 text-center">
            <Link
              to="/login"
              className="text-xs font-semibold text-slate-500 hover:text-navy-900 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Halaman Masuk
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
export default ForgotPasswordPage;
