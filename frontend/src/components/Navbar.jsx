// ============================================================================
// Komponen UI Reusable: Navbar (frontend/src/components/Navbar.jsx)
// [UI Modular Component] Navigasi atas responsif dengan branding & toggle drawer
// ============================================================================

import React from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { Badge } from './ui/Badge.jsx';

export function Navbar({ user, sidebarOpen, setSidebarOpen, onLogout }) {
  return (
    <header className="bg-navy-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500 text-navy-950 font-bold flex items-center justify-center text-sm shadow">
          SL
        </div>
        <div>
          <span className="font-bold text-sm tracking-wide">SIPK-LEBAK</span>
          <span className="text-[10px] text-amber-300 block -mt-1">UMKM Kab. Lebak</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <span className="text-xs text-slate-300 px-2 py-1 rounded bg-navy-800 border border-navy-700">
            {user.role}
          </span>
        )}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-slate-200 hover:bg-navy-800 transition"
          aria-label="Toggle navigasi"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
    </header>
  );
}

export default Navbar;
