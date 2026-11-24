// ============================================================================
// Layout Autentikasi (frontend/src/layouts/AuthLayout.jsx)
// Sesuai desain: panel navy kiri (brand + judul) & panel putih kanan (form)
// ============================================================================

import React from 'react';
import { Link } from 'react-router-dom';

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Panel Kiri Navy */}
      <div className="md:w-1/2 bg-navy-900 text-white px-8 py-10 md:px-[60px] md:py-[80px] flex flex-col justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-[55px] h-[55px] rounded-xl bg-amber-500 flex items-center justify-center font-extrabold text-navy-900 text-2xl">
            SL
          </div>
          <div>
            <h1 className="font-bold text-xl text-white leading-tight">SIPK-LEBAK</h1>
            <p className="text-sm text-slate-300">Dinas Koperasi & UKM</p>
          </div>
        </div>

        <div className="my-12 md:my-0">
          <h2 className="text-3xl font-bold text-white leading-snug max-w-md">
            Sistem Informasi Pembinaan & Kurasi UMKM
          </h2>
          <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-md">
            Portal resmi verifikasi kelayakan produk, standardisasi legalitas komoditas, dan agregasi
            kemitraan pasar Kabupaten Lebak.
          </p>
        </div>

        <div className="pt-4 border-t border-blue-900/60 text-xs text-slate-400 flex items-center justify-between gap-4">
          <span>Pemerintah Kabupaten Lebak &bull; Dinas Koperasi dan Usaha Kecil Menengah</span>
          <Link to="/katalog" className="text-amber-400 hover:underline whitespace-nowrap">
            Katalog Publik &rarr;
          </Link>
        </div>
      </div>

      {/* Panel Kanan Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-xl">
          {(title || subtitle) && (
            <div className="mb-8">
              {title && <h2 className="text-2xl font-bold text-slate-900">{title}</h2>}
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
