import {
  LayoutDashboard,
  Building2,
  Package,
  FileCheck,
  ShoppingBag,
  Users,
  Layers,
  FileText,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';

export const MENUS_BY_ROLE = {
  umkm: [
    { label: 'Dasbor', path: '/umkm/dasbor', icon: LayoutDashboard, enabled: true },
    { label: 'Profil Usaha & Legalitas', path: '/umkm/profil', icon: Building2, enabled: true },
    { label: 'Produk Saya', path: '/umkm/produk', icon: Package, enabled: true },
    { label: 'Kemitraan & Pesanan', path: '/umkm/pesanan', icon: ShoppingBag, enabled: false, badge: 'Sprint 2' },
  ],
  staf: [
    { label: 'Dasbor Dinas', path: '/dinas/dasbor', icon: LayoutDashboard, enabled: true },
    { label: 'Antrean Kurasi', path: '/dinas/kurasi', icon: FileCheck, enabled: true },
    { label: 'Direktori UMKM', path: '/dinas/umkm', icon: Users, enabled: true },
    { label: 'Katalog Publik', path: '/katalog', icon: ShoppingBag, enabled: true },
    { label: 'Sintesa Komoditas', path: '/dinas/sintesa', icon: BarChart3, enabled: false, badge: 'Sprint 3' },
  ],
  kabid: [
    { label: 'Dasbor Eksekutif', path: '/dinas/dasbor', icon: LayoutDashboard, enabled: true },
    { label: 'Persetujuan Kurasi', path: '/dinas/kurasi', icon: ShieldCheck, enabled: true },
    { label: 'Direktori UMKM', path: '/dinas/umkm', icon: Users, enabled: true },
    { label: 'Katalog Publik', path: '/katalog', icon: ShoppingBag, enabled: true },
    { label: 'Sintesa & Rekomendasi', path: '/dinas/sintesa', icon: BarChart3, enabled: false, badge: 'Sprint 3' },
  ],
  mitra: [
    { label: 'Katalog Produk Terkurasi', path: '/katalog', icon: ShoppingBag, enabled: true },
    { label: 'Permintaan Pesanan (RFQ)', path: '/mitra/rfq', icon: FileText, enabled: false, badge: 'Sprint 2' },
    { label: 'Konsolidasi & PO', path: '/mitra/po', icon: Layers, enabled: false, badge: 'Sprint 2' },
  ],
};
