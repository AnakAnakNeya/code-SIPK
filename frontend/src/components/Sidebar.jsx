// ============================================================================
// Sidebar (frontend/src/components/Sidebar.jsx)
// Navigasi samping bergrup sesuai desain UI: logo SL, label grup, menu aktif biru
// ============================================================================

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';

const ROLE_LABEL = {
  umkm: 'Pelaku UMKM',
  staf: 'Staf Dinas',
  kabid: 'Kepala Bidang UMKM',
  mitra: 'Mitra Usaha',
};

export function Sidebar({ user, menus = [], sidebarOpen, setSidebarOpen, onLogout }) {
  // Kelompokkan menu berdasarkan field `group` (urutan kemunculan dipertahankan)
  const groups = [];
  menus.forEach((item) => {
    const name = item.group || 'Menu Utama';
    let g = groups.find((x) => x.name === name);
    if (!g) {
      g = { name, items: [] };
      groups.push(g);
    }
    g.items.push(item);
  });

  return (
    <aside
      className={`fixed md:sticky top-0 bottom-0 left-0 z-30 w-[260px] shrink-0 bg-navy-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } h-screen overflow-y-auto px-4 py-6`}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 pb-6 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-amber-500 text-navy-900 font-extrabold text-lg flex items-center justify-center shrink-0">
          SL
        </div>
        <div>
          <h2 className="text-[15px] font-bold text-white tracking-wide leading-tight">SIPK-LEBAK</h2>
          <p className="text-xs text-slate-400">Dinas Koperasi & UKM</p>
        </div>
      </div>

      {/* Menu bergrup */}
      <nav className="flex-1">
        {groups.map((group) => (
          <div key={group.name}>
            <p className="text-[11px] uppercase tracking-widest text-slate-400 font-semibold mt-6 mb-2 pl-3">
              {group.name}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              if (!item.enabled) {
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 h-10 px-3 rounded-md text-[13px] text-slate-500 cursor-not-allowed select-none"
                  >
                    <Icon className="w-[18px] h-[18px] opacity-50" />
                    <span>{item.label}</span>
                  </div>
                );
              }
              return (
                <NavLink
                  key={item.path + item.label}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 h-10 px-3 mb-0.5 rounded-md text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-[#1E3A8A] text-white font-semibold'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Pengguna & keluar */}
      <div className="pt-4 mt-6 border-t border-white/10">
        <p className="text-xs font-semibold text-white truncate">{user?.nama || user?.namaLengkap || 'Pengguna'}</p>
        <p className="text-[11px] text-slate-400 truncate mb-3">{ROLE_LABEL[user?.role] || user?.role}</p>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 h-9 rounded-md bg-white/5 hover:bg-red-900/50 text-slate-300 hover:text-red-200 text-xs font-medium transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Keluar Akun</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
