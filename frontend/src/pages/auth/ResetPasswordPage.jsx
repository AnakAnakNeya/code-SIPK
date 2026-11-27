// ============================================================================
// [PBI-01] Halaman Atur Ulang Kata Sandi / Reset Password (AC-01-14)
// PIC: Naila
// ============================================================================

import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import api from '../../api/client.js';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { PasswordInput } from '../../components/ui/Input.jsx';
import { PasswordChecklist } from '../../components/ui/PasswordChecklist.jsx';
import { passwordError } from '../../utils/validators.js';
import { Button } from '../../components/ui/Button.jsx';
import { Alert } from '../../components/ui/Alert.jsx';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (!token) {
      setErr('Token pemulihan tidak ditemukan di tautan.');
      return;
    }
    const pwErr = passwordError(password, 'Kata sandi baru');
    if (pwErr) {
      setErr(pwErr);
      return;
    }
    if (password !== confirmPassword) {
      setErr('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setMsg('Kata sandi Anda berhasil diperbarui! Silakan masuk kembali.');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (e) {
      setErr(e.message || 'Gagal mengatur ulang kata sandi. Tautan mungkin telah kedaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Atur Ulang Kata Sandi"
      subtitle="Buat kata sandi baru untuk akun SIPK-Lebak Anda."
    >
      {msg ? (
        <div className="space-y-4">
          <Alert type="success">{msg}</Alert>
          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="text-xs font-bold text-navy-900 hover:text-amber-600 inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Masuk Sekarang
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {err && <Alert type="error">{err}</Alert>}

          <PasswordInput
            label="Kata Sandi Baru"
            required
            placeholder="Buat kata sandi kuat"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <PasswordChecklist password={password} />

          <PasswordInput
            label="Ulangi Kata Sandi Baru"
            required
            placeholder="Ulangi kata sandi baru"
            error={confirmPassword && confirmPassword !== password ? 'Konfirmasi kata sandi tidak cocok' : null}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full font-bold"
            >
              Simpan Kata Sandi Baru
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

export default ResetPasswordPage;
