import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  User,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { MENUS_BY_ROLE } from '../../config/menuConfig.js';
import { Badge } from '../ui/Badge.jsx';

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
      {/* Mobile Topbar */}
      <div className="md:hidden bg-navy-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-navy-950 font-bold flex items-center justify-center text-sm">
            SL
          </div>
          <span className="font-bold text-sm tracking-wide">SIPK-LEBAK</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-slate-200 hover:bg-navy-800"
          aria-label="Toggle menu"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Desktop & Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-30 w-64 bg-navy-900 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } h-screen`}
      >
        <div>
          {/* Logo Brand Header */}
          <div className="p-6 border-b border-navy-800 hidden md:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-navy-950 font-extrabold flex items-center justify-center text-base shadow">
              SL
            </div>
            <div>
              <h2 className="font-bold text-sm text-white tracking-wide">SIPK-LEBAK</h2>
              <p className="text-[11px] text-slate-400">Kabupaten Lebak</p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-4 space-y-1.5 overflow-y-auto">
            {menus.map((item) => {
              const Icon = item.icon;
              if (!item.enabled) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs text-slate-500 cursor-not-allowed select-none"
                    title={`Tersedia di ${item.badge}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 opacity-50" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-navy-800 text-slate-400 border border-navy-700">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                      isActive
                        ? 'bg-amber-500 text-navy-950 font-bold shadow'
                        : 'text-slate-200 hover:bg-navy-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-4 border-t border-navy-800">
          <div className="p-3 rounded-lg bg-navy-800/60 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-xs font-bold text-amber-400">
                {user?.nama?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user?.nama}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                    {user?.role}
                  </span>
                  {user?.status && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-300 hover:bg-navy-800 hover:text-rose-200 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Banner Status Akun UMKM (AC-01-06) */}
        {user?.role === 'umkm' && user?.status === 'menunggu_persetujuan' && (
          <div className="bg-amber-500 text-navy-950 px-4 py-2.5 text-xs md:text-sm font-bold flex items-center justify-between border-b border-amber-600 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0" />
              <span>
                Akun menunggu persetujuan dinas. Anda dapat melengkapi profil usaha dan dokumen legalitas.
              </span>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-semibold bg-navy-900 text-amber-300 px-2.5 py-0.5 rounded-full">
              Tahap Verifikasi
            </span>
          </div>
        )}

        {user?.role === 'umkm' && user?.status === 'ditolak' && (
          <div className="bg-rose-600 text-white px-4 py-2.5 text-xs md:text-sm font-bold flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Pengajuan akun ditolak dinas: {user?.catatanStatus || 'Perbaiki data profil dan dokumen NIB Anda lalu ajukan ulang.'}
              </span>
            </div>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}
