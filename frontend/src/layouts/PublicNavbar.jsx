// ============================================================================
// Header Publik (frontend/src/layouts/PublicNavbar.jsx)
// Navigasi atas untuk pengunjung publik (belum login) di halaman Katalog & Agenda
// ============================================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export function PublicNavbar() {
  const location = useLocation();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/katalog" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500 text-navy-900 font-extrabold text-lg flex items-center justify-center shrink-0">
            SL
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-navy-900 tracking-wide leading-tight">SIPK-LEBAK</h1>
            <p className="text-[11px] text-slate-500">Dinas Koperasi & UKM Kab. Lebak</p>
          </div>
        </Link>

        {/* Tautan Navigasi Publik */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            to="/katalog"
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition ${
              location.pathname === '/katalog'
                ? 'bg-navy-900 text-white font-semibold'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            Katalog Produk
          </Link>
          <Link
            to="/agenda"
            className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition ${
              location.pathname === '/agenda'
                ? 'bg-navy-900 text-white font-semibold'
                : 'text-slate-600 hover:text-navy-900 hover:bg-slate-100'
            }`}
          >
            Agenda Pameran
          </Link>
        </nav>

        {/* Tombol Masuk & Daftar UMKM */}
        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:border-navy-900 hover:text-navy-900 text-xs font-semibold transition"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </Link>
          <Link
            to="/register"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-900 hover:bg-[#1E3A8A] text-white text-xs font-semibold transition shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun UMKM</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default PublicNavbar;
