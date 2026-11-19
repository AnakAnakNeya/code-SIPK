// ============================================================================
// Layout Halaman Utama SIPK-Lebak (frontend/src/layouts/AppLayout.jsx)
// Menggabungkan Navbar, Sidebar modular, dan Banner Status Akun UMKM
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { MENUS_BY_ROLE } from '../config/menuConfig.js';
import { Navbar, Sidebar } from '../components/index.js';

export function AppLayout({ children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const menus = MENUS_BY_ROLE[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <Navbar
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={handleLogout}
      />

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
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Banner Status Akun UMKM */}
        {user?.role === 'UMKM' && user?.statusAkun !== 'AKTIF' && (
          <div
            className={`px-4 py-3 text-xs md:text-sm font-medium flex items-center justify-between border-b ${
              user?.statusAkun === 'MENUNGGU_VERIFIKASI'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-red-50 text-red-900 border-red-200'
            }`}
          >
            <div className="flex items-center gap-2 max-w-4xl">
              {user?.statusAkun === 'MENUNGGU_VERIFIKASI' ? (
                <>
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>Akun Sedang Diverifikasi:</strong> Profil usaha Anda sedang ditinjau oleh Dinas Koperasi & UKM Lebak. Anda dapat melengkapi profil dan dokumen legalitas.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>
                    <strong>Pendaftaran Ditolak:</strong> {user?.catatanPenolakan || 'Silakan perbarui dokumen legalitas atau hubungi Dinas.'}
                  </span>
                </>
              )}
            </div>
            {user?.statusAkun === 'MENUNGGU_VERIFIKASI' && (
              <span className="hidden sm:inline-block text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
                Maks. 3x24 Jam
              </span>
            )}
          </div>
        )}

        {/* Child Pages Container */}
        <div className="p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}

export default AppLayout;
