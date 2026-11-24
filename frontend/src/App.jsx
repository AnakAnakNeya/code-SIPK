import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';

// Pages - Sprint 1
import LoginPage from './pages/auth/LoginPage.jsx';
import RegisterWizardPage from './pages/auth/RegisterWizardPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import CatalogPage from './pages/catalog/CatalogPage.jsx';
import DashboardUmkmPage from './pages/umkm/DashboardUmkmPage.jsx';
import ProfilUsahaPage from './pages/umkm/ProfilUsahaPage.jsx';
import ProdukSayaPage from './pages/umkm/ProdukSayaPage.jsx';
import DashboardDinasPage from './pages/dinas/DashboardDinasPage.jsx';
import KurasiDinasPage from './pages/dinas/KurasiDinasPage.jsx';
import DirektoriUmkmPage from './pages/dinas/DirektoriUmkmPage.jsx';

// Pages - Sprint 2
import DashboardMitraPage from './pages/mitra/DashboardMitraPage.jsx';
import RfqMitraPage from './pages/mitra/RfqMitraPage.jsx';
import RfqTerbukaPage from './pages/umkm/RfqTerbukaPage.jsx';
import RfqDinasPage from './pages/dinas/RfqDinasPage.jsx';

// Pages - Sprint 3
import ForumPage from './pages/forum/ForumPage.jsx';
import EventUmkmPage from './pages/umkm/EventUmkmPage.jsx';
import EventDinasPage from './pages/dinas/EventDinasPage.jsx';
import SintesaPage from './pages/sintesa/SintesaPage.jsx';
import AkunAuditPage from './pages/dinas/AkunAuditPage.jsx';
import EventPublikPage from './pages/publik/EventPublikPage.jsx';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-navy-900 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Memuat data SIPK-Lebak...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <AppLayout>
        <div className="max-w-md mx-auto text-center py-16 bg-white p-8 rounded-2xl border border-slate-200">
          <h2 className="text-xl font-bold text-navy-900">Akses Ditolak (403)</h2>
          <p className="text-xs text-slate-500 mt-2">
            Anda tidak memiliki hak wewenang untuk membuka halaman ini.
          </p>
        </div>
      </AppLayout>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}

function RootRedirect() {
  const { user, loading, getHomePath } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-navy-900 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (user) {
    return <Navigate to={getHomePath(user.role)} replace />;
  }
  return <Navigate to="/login" replace />;
}

export function App() {
  return (
    <Routes>
      {/* Rute Publik & Beranda Pintar */}
      <Route path="/" element={<RootRedirect />} />
      <Route path="/katalog" element={<CatalogPage />} />
      <Route path="/agenda" element={<EventPublikPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterWizardPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Rute Bersama (Forum Komunitas - UMKM, Staf, Kabid) */}
      <Route
        path="/forum"
        element={
          <ProtectedRoute allowedRoles={['umkm', 'staf', 'kabid']}>
            <ForumPage />
          </ProtectedRoute>
        }
      />

      {/* Rute Khusus UMKM */}
      <Route
        path="/umkm/dasbor"
        element={
          <ProtectedRoute allowedRoles={['umkm']}>
            <DashboardUmkmPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/umkm/profil"
        element={
          <ProtectedRoute allowedRoles={['umkm']}>
            <ProfilUsahaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/umkm/produk"
        element={
          <ProtectedRoute allowedRoles={['umkm']}>
            <ProdukSayaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/umkm/rfq"
        element={
          <ProtectedRoute allowedRoles={['umkm']}>
            <RfqTerbukaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/umkm/event"
        element={
          <ProtectedRoute allowedRoles={['umkm']}>
            <EventUmkmPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/umkm/sintesa"
        element={
          <ProtectedRoute allowedRoles={['umkm']}>
            <SintesaPage />
          </ProtectedRoute>
        }
      />

      {/* Rute Khusus Staf & Kabid Dinas */}
      <Route
        path="/dinas/dasbor"
        element={
          <ProtectedRoute allowedRoles={['staf', 'kabid']}>
            <DashboardDinasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dinas/kurasi"
        element={
          <ProtectedRoute allowedRoles={['staf', 'kabid']}>
            <KurasiDinasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dinas/umkm"
        element={
          <ProtectedRoute allowedRoles={['staf', 'kabid']}>
            <DirektoriUmkmPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dinas/rfq"
        element={
          <ProtectedRoute allowedRoles={['staf', 'kabid']}>
            <RfqDinasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dinas/event"
        element={
          <ProtectedRoute allowedRoles={['staf', 'kabid']}>
            <EventDinasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dinas/sintesa"
        element={
          <ProtectedRoute allowedRoles={['staf', 'kabid']}>
            <SintesaPage />
          </ProtectedRoute>
        }
      />

      {/* Rute Khusus Kabid Dinas (Manajemen Akun & Log Audit) */}
      <Route
        path="/dinas/akun"
        element={
          <ProtectedRoute allowedRoles={['kabid']}>
            <AkunAuditPage />
          </ProtectedRoute>
        }
      />

      {/* Rute Khusus Mitra */}
      <Route
        path="/mitra/dasbor"
        element={
          <ProtectedRoute allowedRoles={['mitra']}>
            <DashboardMitraPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mitra/rfq"
        element={
          <ProtectedRoute allowedRoles={['mitra']}>
            <RfqMitraPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/katalog" replace />} />
    </Routes>
  );
}

export default App;
