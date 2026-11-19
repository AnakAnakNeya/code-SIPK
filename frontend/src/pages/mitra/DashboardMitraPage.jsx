// ============================================================================
// [Sprint 2 / Mitra B2B] Halaman Dashboard Mitra (frontend/src/pages/mitra/DashboardMitraPage.jsx)
// Fitur Permintaan Penawaran (RFQ), Kuota Kolaboratif, dan PO Elektronik
// ============================================================================

import React from 'react';
import { ShoppingCart, FileText, CheckCircle2, TrendingUp, Sparkles, PlusCircle } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../../components/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';

export function DashboardMitraPage() {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/40">
              <Sparkles className="w-4 h-4" />
              <span>Portal Mitra Bisnis & Pengadaan B2B (Sprint 2)</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Kemitraan Komoditas Lebak</h1>
            <p className="text-sm text-slate-300">
              Pusat penerbitan Permintaan Penawaran (RFQ), pemantauan kuota agregasi UMKM, dan penerbitan Purchase Order resmi.
            </p>
          </div>
          <Button className="bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold shrink-0">
            <PlusCircle className="w-4 h-4 mr-2" />
            Buat RFQ Baru
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">RFQ Aktif</span>
            <ShoppingCart className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">2</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Menunggu agregasi kuota</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">UMKM Tergabung</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">14</p>
          <span className="text-[11px] text-emerald-600 mt-1 block">Tersebar di 6 kecamatan</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Purchase Order</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">5</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Telah diterbitkan & tervalidasi</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Status Kemitraan</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-emerald-700 mt-2">Mitra Terverifikasi</p>
          <span className="text-[11px] text-slate-400 mt-1 block">Dinas Koperasi & UKM Lebak</span>
        </Card>
      </div>

      {/* Info Card Sprint 2 */}
      <Card className="p-6 bg-amber-50/60 border-amber-200">
        <h3 className="text-base font-semibold text-amber-900">Alur Kerja Kemitraan B2B (PRD Sprint 2):</h3>
        <ul className="mt-3 space-y-2 text-xs text-amber-950/80 list-disc list-inside">
          <li><strong>PBI-07:</strong> Mitra membuat dokumen Request for Quotation (RFQ) dengan target kuota dan spesifikasi mutu.</li>
          <li><strong>PBI-08:</strong> Pelaku UMKM terkurasi mengajukan kontribusi kuota secara kolaboratif hingga target terpenuhi.</li>
          <li><strong>PBI-09:</strong> Dinas melakukan kurasi kuota dan menerbitkan Surat Perjanjian / PO elektronik resmi berformat PDF.</li>
        </ul>
      </Card>
    </div>
  );
}

export default DashboardMitraPage;
