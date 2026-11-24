import {
  LayoutDashboard,
  Building2,
  Package,
  FileCheck,
  ShoppingBag,
  Users,
  FileText,
  ShieldCheck,
  Calendar,
  Sparkles,
  MessageSquare,
  KeyRound,
} from 'lucide-react';

// Grup menu mengikuti desain UI: MENU UTAMA, LAYANAN & KOMUNITAS, TATA KELOLA
export const GROUPS = {
  UTAMA: 'Menu Utama',
  LAYANAN: 'Layanan & Komunitas',
  TATA_KELOLA: 'Tata Kelola',
};

export const MENUS_BY_ROLE = {
  umkm: [
    { label: 'Dasbor', path: '/umkm/dasbor', icon: LayoutDashboard, enabled: true, group: GROUPS.UTAMA },
    { label: 'Profil Usaha & Legalitas', path: '/umkm/profil', icon: Building2, enabled: true, group: GROUPS.UTAMA },
    { label: 'Produk Saya', path: '/umkm/produk', icon: Package, enabled: true, group: GROUPS.UTAMA },
    { label: 'Katalog Publik', path: '/katalog', icon: ShoppingBag, enabled: true, group: GROUPS.UTAMA },
    { label: 'Agregasi Pesanan (RFQ)', path: '/umkm/rfq', icon: FileText, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Kemasan Sintesa', path: '/umkm/sintesa', icon: Sparkles, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Event Daerah', path: '/umkm/event', icon: Calendar, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Forum Komunitas', path: '/forum', icon: MessageSquare, enabled: true, group: GROUPS.LAYANAN },
  ],
  staf: [
    { label: 'Dasbor Dinas', path: '/dinas/dasbor', icon: LayoutDashboard, enabled: true, group: GROUPS.UTAMA },
    { label: 'Antrean Kurasi', path: '/dinas/kurasi', icon: FileCheck, enabled: true, group: GROUPS.UTAMA },
    { label: 'Direktori UMKM', path: '/dinas/umkm', icon: Users, enabled: true, group: GROUPS.UTAMA },
    { label: 'Katalog Publik', path: '/katalog', icon: ShoppingBag, enabled: true, group: GROUPS.UTAMA },
    { label: 'Verifikasi RFQ & PO', path: '/dinas/rfq', icon: FileText, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Kemasan Sintesa', path: '/dinas/sintesa', icon: Sparkles, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Event Daerah', path: '/dinas/event', icon: Calendar, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Forum Komunitas', path: '/forum', icon: MessageSquare, enabled: true, group: GROUPS.LAYANAN },
  ],
  kabid: [
    { label: 'Dasbor Analitik', path: '/dinas/dasbor', icon: LayoutDashboard, enabled: true, group: GROUPS.UTAMA },
    { label: 'Persetujuan Kurasi', path: '/dinas/kurasi', icon: ShieldCheck, enabled: true, group: GROUPS.UTAMA },
    { label: 'Direktori UMKM', path: '/dinas/umkm', icon: Users, enabled: true, group: GROUPS.UTAMA },
    { label: 'Katalog Publik', path: '/katalog', icon: ShoppingBag, enabled: true, group: GROUPS.UTAMA },
    { label: 'Verifikasi RFQ & PO', path: '/dinas/rfq', icon: FileText, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Kemasan Sintesa', path: '/dinas/sintesa', icon: Sparkles, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Event Daerah', path: '/dinas/event', icon: Calendar, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Forum Komunitas', path: '/forum', icon: MessageSquare, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Manajemen Akun & Audit', path: '/dinas/akun', icon: KeyRound, enabled: true, group: GROUPS.TATA_KELOLA },
  ],
  mitra: [
    { label: 'Dasbor Mitra', path: '/mitra/dasbor', icon: LayoutDashboard, enabled: true, group: GROUPS.UTAMA },
    { label: 'Katalog Terkurasi', path: '/katalog', icon: ShoppingBag, enabled: true, group: GROUPS.UTAMA },
    { label: 'Permintaan Pesanan (RFQ)', path: '/mitra/rfq', icon: FileText, enabled: true, group: GROUPS.LAYANAN },
    { label: 'Agenda Pameran', path: '/agenda', icon: Calendar, enabled: true, group: GROUPS.LAYANAN },
  ],
};
