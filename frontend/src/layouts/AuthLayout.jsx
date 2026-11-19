// ============================================================================
// Layout Halaman Autentikasi SIPK-Lebak (frontend/src/layouts/AuthLayout.jsx)
// Panel Navy Brand kiri & Panel Formulir kanan (< 300 KB)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Panel Kiri Navy Brand */}
      <div className="md:w-5/12 lg:w-4/12 bg-navy-900 text-white p-8 md:p-12 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center font-extrabold text-navy-950 text-xl shadow-lg">
              SL
            </div>
            <div>
              <h1 className="font-extrabold tracking-tight text-lg text-white">SIPK-LEBAK</h1>
              <p className="text-xs text-slate-300">Pemasaran Kolaboratif UMKM</p>
            </div>
          </div>

          <div className="mt-12">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy-800 text-amber-400 border border-navy-700 mb-4">
              <ShieldCheck className="w-3.5 h-3.5" />
              Dinas Koperasi & UMKM Kab. Lebak
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              Pusat Kurasi & Pemasaran Komoditas Unggulan Lebak.
            </h2>
            <p className="mt-4 text-sm text-slate-300 leading-relaxed">
              Mewadahi produk olahan pangan dan kriya tenun khas Lebak menuju standardisasi mutu,
              lencana kurasi resmi dinas, dan kemitraan pasar yang berkelanjutan.
            </p>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-navy-800 text-xs text-slate-400 flex items-center justify-between">
          <span>&copy; {new Date().getFullYear()} Pemkab Lebak</span>
          <Link to="/katalog" className="text-amber-400 hover:underline">
            Katalog Publik &rarr;
          </Link>
        </div>
      </div>

      {/* Panel Kanan Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-xl">
          {(title || subtitle) && (
            <div className="mb-8">
              {title && <h2 className="text-2xl font-extrabold text-navy-900">{title}</h2>}
              {subtitle && <p className="text-sm text-slate-500 mt-1.5">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
export default AuthLayout;
