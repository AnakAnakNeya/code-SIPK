// ============================================================================
// [PBI-01] Halaman Masuk Multi-Identifier (FR-01)
// PIC: Naila
// Kriteria: AC-01-08 (Input Email atau 13 Digit NIB, Ingat Saya, Tautan Lupa Sandi & Daftar)
// ============================================================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { AuthLayout } from '../../components/layout/AuthLayout.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
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
      title="Masuk ke SIPK-Lebak"
      subtitle="Gunakan alamat email atau 13 digit NIB terdaftar Anda."
    >
      {error && (
        <Alert type="error" className="mb-6">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email atau NIB"
          id="identifier"
          name="identifier"
          required
          autoComplete="username"
          placeholder="nama@contoh.com atau 13 digit NIB"
          helperText="Ketik 13 digit angka untuk masuk menggunakan NIB OSS-RBA"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />

        <Input
          label="Kata Sandi"
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between text-xs pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-600 select-none">
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
            className="font-medium text-navy-900 hover:text-amber-600 transition"
          >
            Lupa kata sandi?
          </Link>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full font-bold"
            loading={loading}
          >
            Masuk ke Sistem
          </Button>
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-200 text-center">
        <p className="text-sm text-slate-600">
          Belum memiliki akun usaha binaan?{' '}
          <Link
            to="/register"
            className="font-bold text-navy-900 hover:text-amber-600 transition"
          >
            Daftar sebagai Pelaku UMKM
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
export default LoginPage;
