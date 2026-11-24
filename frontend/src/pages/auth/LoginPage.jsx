// ============================================================================
// [PBI-01] Halaman Masuk Multi-Identifier (frontend/src/pages/auth/LoginPage.jsx)
// Tampilan disesuaikan dengan desain stitch: sipk_lebak_login
// ============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { AuthLayout } from '../../layouts/AuthLayout.jsx';
import { Alert } from '../../components/ui/Alert.jsx';

export function LoginPage() {
  const { login, getHomePath } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(identifier, password, remember);
      const target = getHomePath(data.role);
      navigate(target);
    } catch (err) {
      setError(err.message || 'Email/NIB atau kata sandi salah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Masuk ke Portal"
      subtitle="Masukkan kredensial akun terdaftar Anda"
    >
      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">
            Email atau Nomor Induk Berusaha (NIB)
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autoComplete="username"
            placeholder="nama@email.com atau 13 digit NIB"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full h-11 px-3.5 text-sm rounded-md border border-slate-200 outline-none focus:border-navy-900 transition bg-white"
          />
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-slate-900 mb-1.5">
            Kata Sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3.5 text-sm rounded-md border border-slate-200 outline-none focus:border-navy-900 transition bg-white"
          />
        </div>

        <div className="flex items-center justify-between text-[13px] pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded border-slate-300 text-navy-900 focus:ring-navy-900"
            />
            <span>Ingat saya di perangkat ini</span>
          </label>

          <Link
            to="/forgot-password"
            className="font-medium text-[#1E3A8A] hover:underline"
          >
            Lupa sandi?
          </Link>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-navy-900 hover:bg-[#1E3A8A] text-white text-sm font-semibold rounded-md transition flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Memeriksa...' : 'Masuk'}
          </button>
        </div>
      </form>

      <div className="mt-7 pt-5 border-t border-slate-200 text-center text-[13px] text-slate-500">
        <p>Belum memiliki akun usaha?</p>
        <Link
          to="/register"
          className="font-semibold text-[#1E3A8A] hover:underline block mt-1"
        >
          Daftar sebagai Pelaku UMKM
        </Link>
      </div>
    </AuthLayout>
  );
}
export default LoginPage;
