// ============================================================================
// Komponen UI Reusable: Sidebar (frontend/src/components/Sidebar.jsx)
// [UI Modular Component] Navigasi samping per peran pengguna (UMKM, Dinas, Mitra)
// ============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { Badge } from './ui/Badge.jsx';

export function Sidebar({ user, menus = [], sidebarOpen, setSidebarOpen, onLogout }) {
  return (
    <aside
      className={`fixed md:sticky top-0 bottom-0 left-0 z-30 w-64 bg-navy-900 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } h-screen shadow-xl md:shadow-none`}
    >
      <div>
        {/* Brand Header */}
        <div className="p-6 border-b border-navy-800 hidden md:flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-navy-950 font-extrabold flex items-center justify-center text-lg shadow-md">
            SL
          </div>
          <div>
            <h2 className="font-bold text-sm text-white tracking-wide">SIPK-LEBAK</h2>
            <p className="text-[11px] text-slate-400">Pemasaran UMKM Lebak</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-190px)]">
          {menus.map((item) => {
            const Icon = item.icon;
            if (!item.enabled) {
              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs text-slate-500 cursor-not-allowed select-none"
                  title={`Tersedia di ${item.badge || 'Sprint Selanjutnya'}`}
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
                      ? 'bg-amber-500 text-navy-950 font-semibold shadow'
                      : 'text-slate-300 hover:bg-navy-800 hover:text-white'
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

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-navy-800 bg-navy-950/60">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-amber-400">
            <User className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.namaLengkap || 'Pengguna'}</p>
            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            <div className="mt-1">
              <Badge variant="warning">{user?.role}</Badge>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-navy-800 hover:bg-red-900/60 text-slate-300 hover:text-red-200 text-xs font-medium transition border border-navy-700 hover:border-red-800"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
