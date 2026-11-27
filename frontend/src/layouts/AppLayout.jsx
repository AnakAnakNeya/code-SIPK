// ============================================================================
// Layout Halaman Utama SIPK-Lebak (frontend/src/layouts/AppLayout.jsx)
// Menggabungkan Navbar, Sidebar modular, dan Banner Status Akun UMKM
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { MENUS_BY_ROLE } from '../config/menuConfig.js';
import { Navbar, Sidebar } from '../components/index.js';
import { PasswordChecklist } from '../components/ui/PasswordChecklist.jsx';
import { passwordError } from '../utils/validators.js';

export function AppLayout({ children }) {
  const { user, logout, refreshUser } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState(null);
  const navigate = useNavigate();

  const isMustChangePassword = Boolean(user?.mustChangePassword);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError(null);
    if (!currentPassword) return setPwdError('Kata sandi saat ini wajib diisi');
    const pwErr = passwordError(newPassword, 'Kata sandi baru');
    if (pwErr) return setPwdError(pwErr);
    if (newPassword !== confirmPassword) return setPwdError('Konfirmasi kata sandi baru tidak cocok');
    if (currentPassword === newPassword) return setPwdError('Kata sandi baru harus berbeda dari kata sandi sementara');

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      await refreshUser();
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwdError(err.message || 'Gagal mengganti kata sandi');
    } finally {
      setPwdLoading(false);
    }
  };

  const menus = MENUS_BY_ROLE[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isUmkm = user?.role?.toLowerCase() === 'umkm';
  const isPending = user?.status === 'menunggu_persetujuan';
  const isRejected = user?.status === 'ditolak';

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex">
      {/* Modal Wajib Ganti Kata Sandi (AC-01-15) */}
      {(isMustChangePassword || passwordModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-2">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-extrabold text-navy-900">Ganti Kata Sandi Wajib</h3>
              <p className="text-xs text-slate-500 mt-1">
                Akun Anda dibuat dengan kata sandi sementara oleh dinas. Silakan tentukan kata sandi baru untuk melanjutkan.
              </p>
            </div>

            {pwdError && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
                {pwdError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Kata Sandi Sementara (Saat Ini) *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi sementara"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Kata Sandi Baru *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Buat kata sandi kuat"
                  value={newPassword}
                  maxLength={64}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
                <PasswordChecklist password={newPassword} className="mt-2" />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-900 mb-1">
                  Ulangi Kata Sandi Baru *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-navy-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={pwdLoading}
                  className="w-full h-10 rounded-lg bg-navy-900 hover:bg-[#1E3A8A] text-white text-xs font-bold transition flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  {pwdLoading ? 'Menyimpan...' : 'Perbarui Kata Sandi & Lanjutkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar Modular */}
      <Sidebar
        user={user}
        menus={menus}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

      {/* Backdrop overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
      <Navbar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Banner Status Akun UMKM (AC-01-06 & AC-06-07) */}
        {isUmkm && user?.status !== 'aktif' && (
          <div
            className={`px-4 py-3 text-xs md:text-sm font-medium flex items-center justify-between border-b ${
              isPending
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2 max-w-4xl">
              {isPending ? (
                <>
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Akun Menunggu Persetujuan Dinas:</strong> Profil usaha Anda sedang ditinjau oleh Dinas Koperasi & UKM Lebak. Anda dapat melengkapi profil dan dokumen legalitas.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    <strong>Pendaftaran Akun Ditolak:</strong> {user?.catatanStatus || 'Silakan perbarui dokumen legalitas atau ajukan ulang verifikasi.'}
                  </span>
                </>
              )}
            </div>
            {isPending && (
              <span className="hidden sm:inline-block text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                Menunggu Verifikasi
              </span>
            )}
          </div>
        )}

        {/* Child Pages Container */}
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
      </div>
    </div>
  );
}

export default AppLayout;
