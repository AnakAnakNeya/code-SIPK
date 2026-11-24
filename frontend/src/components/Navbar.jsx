// ============================================================================
// Header Atas (frontend/src/components/Navbar.jsx)
// Desktop: kotak pencarian + chip peran + avatar/identitas pengguna (sesuai desain)
// Mobile: logo + tombol buka sidebar
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Search } from 'lucide-react';

const ROLE_LABEL = {
  umkm: 'Pelaku UMKM',
  staf: 'Staf Dinas',
  kabid: 'Kepala Bidang UMKM',
  mitra: 'Mitra Usaha',
};

function initials(name = '') {
  return (
    name
      .replace(/[^A-Za-z\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'U'
  );
}

export function Navbar({ user, sidebarOpen, setSidebarOpen }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const nama = user?.nama || user?.namaLengkap || 'Pengguna';

  const submitSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/katalog?q=${encodeURIComponent(term)}` : '/katalog');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-4 px-4 md:px-8 sticky top-0 z-20">
      {/* Mobile brand + toggle */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
          aria-label="Toggle navigasi"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <div className="w-8 h-8 rounded-lg bg-amber-500 text-navy-900 font-extrabold flex items-center justify-center text-sm">
          SL
        </div>
      </div>

      {/* Pencarian */}
      <form onSubmit={submitSearch} className="hidden md:flex items-center gap-2.5 w-[420px] max-w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari komoditas, nama UMKM, kecamatan, atau NIB..."
          className="flex-1 text-[13px] bg-transparent outline-none placeholder:text-slate-400"
        />
      </form>

      {/* Identitas pengguna */}
      <div className="flex items-center gap-3 ml-auto">
        <span className="hidden sm:inline-block text-xs font-medium text-slate-600 border border-slate-200 rounded-md px-3 py-1.5 bg-white">
          {ROLE_LABEL[user?.role] || user?.role}
        </span>
        <div className="w-9 h-9 rounded-full bg-navy-900 text-white text-xs font-bold flex items-center justify-center">
          {initials(nama)}
        </div>
        <div className="hidden sm:block leading-tight">
          <p className="text-[13px] font-semibold text-slate-900">{nama}</p>
          <p className="text-[11px] text-slate-500 truncate max-w-[220px]">{user?.email}</p>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
