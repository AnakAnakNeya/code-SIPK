import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';

// Pages
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
import DashboardMitraPage from './pages/mitra/DashboardMitraPage.jsx';

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

export function App() {
  return (
    <Routes>
      {/* Rute Publik */}
      <Route path="/" element={<Navigate to="/katalog" replace />} />
      <Route path="/katalog" element={<CatalogPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterWizardPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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

      {/* Rute Khusus Mitra */}
      <Route
        path="/mitra/dasbor"
        element={
          <ProtectedRoute allowedRoles={['mitra']}>
            <DashboardMitraPage />
          </ProtectedRoute>
        }
      />

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/katalog" replace />} />
    </Routes>
  );
}
export default App;
