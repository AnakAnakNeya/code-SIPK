// ============================================================================
// Halaman Manajemen Akun, Hak Akses & Log Audit (Dinas: Kabid Only)
// [PBI-16] Manajemen Akun, Matriks Hak Akses, Log Audit (FR-13)
// PIC: Abdullah | Aktor: kabid
// ============================================================================

import React, { useState, useEffect } from 'react';
import {
  Users,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Plus,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Clock,
  History,
  Lock,
  FileText,
  UserCheck,
  UserX,
  Copy,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/api.js';
import { Card, CardHeader, CardContent } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/Modal.jsx';
import { Input } from '../../components/ui/Input.jsx';

export function AkunAuditPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pengguna'); // 'pengguna' | 'matriks' | 'audit'

  // Tab 1: Pengguna
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Tambah Akun
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    nama: '',
    email: '',
    noHp: '',
    role: 'staf',
    instansi: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [newAccountAlert, setNewAccountAlert] = useState(null); // { user, tempPassword }

  // Modal Ubah Status / Nonaktifkan
  const [statusTarget, setStatusTarget] = useState(null);
  const [targetNewStatus, setTargetNewStatus] = useState('nonaktif');
  const [deactivateReason, setDeactivateReason] = useState('');
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Modal Ubah Role
  const [roleTarget, setRoleTarget] = useState(null);
  const [targetNewRole, setTargetNewRole] = useState('staf');
  const [roleSubmitting, setRoleSubmitting] = useState(false);

  // Tab 2: Matriks Hak Akses
  const [matrixData, setMatrixData] = useState(null);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  // Tab 3: Log Audit
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');

  useEffect(() => {
    if (activeTab === 'pengguna') {
      fetchUsers();
    } else if (activeTab === 'matriks') {
      fetchMatrix();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab, roleFilter, statusFilter, auditActionFilter]);

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      setErrorMsg('');
      const params = {};
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.q = searchQuery;

      const res = await api.get('/accounts', { params });
      setUsers(res.data?.items || res.data || []);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat daftar pengguna');
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchMatrix = async () => {
    try {
      setLoadingMatrix(true);
      const res = await api.get('/permissions/matrix');
      setMatrixData(res.data);
    } catch (err) {
      console.warn('Gagal memuat matriks hak akses:', err);
    } finally {
      setLoadingMatrix(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const params = {};
      if (auditActionFilter) params.aksi = auditActionFilter;
      const res = await api.get('/audit-logs', { params });
      setAuditLogs(res.data?.items || res.data || []);
    } catch (err) {
      console.warn('Gagal memuat log audit:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreateSubmitting(true);
      const res = await api.post('/accounts', createForm);
      setIsCreateOpen(false);
      setNewAccountAlert({
        user: res.data?.user || res.data,
        tempPassword: res.data?.tempPassword,
      });
      setCreateForm({ nama: '', email: '', noHp: '', role: 'staf', instansi: '' });
      fetchUsers();
    } catch (err) {
      alert(err.message || 'Gagal membuat akun');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleStatusChange = async (e) => {
    e.preventDefault();
    if (!statusTarget) return;

    try {
      setStatusSubmitting(true);
      await api.patch(`/accounts/${statusTarget._id}/status`, {
        status: targetNewStatus,
        alasan: targetNewStatus === 'nonaktif' ? deactivateReason : undefined,
      });
      setSuccessMsg(
        `Status akun ${statusTarget.nama} berhasil diubah menjadi ${targetNewStatus}.`,
      );
      setStatusTarget(null);
      setDeactivateReason('');
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Gagal mengubah status akun');
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleRoleChange = async (e) => {
    e.preventDefault();
    if (!roleTarget) return;

    try {
      setRoleSubmitting(true);
      await api.patch(`/accounts/${roleTarget._id}/role`, {
        role: targetNewRole,
      });
      setSuccessMsg(`Peran akun ${roleTarget.nama} berhasil diubah menjadi ${targetNewRole}.`);
      setRoleTarget(null);
      fetchUsers();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      alert(err.message || 'Gagal mengubah peran akun');
    } finally {
      setRoleSubmitting(false);
    }
  };

  const handleResetPassword = async (targetUser) => {
    if (!window.confirm(`Reset kata sandi untuk akun "${targetUser.nama}"?`)) return;
    try {
      const res = await api.post(`/accounts/${targetUser._id}/reset-password`);
      setNewAccountAlert({
        user: targetUser,
        tempPassword: res.data?.tempPassword,
      });
    } catch (err) {
      alert(err.message || 'Gagal mereset kata sandi');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Kata sandi disalin ke clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Tata Kelola Keamanan & Hak Akses
          </span>
          <h1 className="text-2xl font-extrabold text-navy-900 mt-1">
            Manajemen Akun & Log Audit
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola pengguna staf dan mitra, tinjau matriks kewenangan RBAC, dan pantau rekam jejak sistem.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('pengguna')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'pengguna'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Pengguna ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matriks')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'matriks'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Matriks Hak Akses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
              activeTab === 'audit'
                ? 'bg-white text-navy-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Log Audit
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 1: PENGGUNA & AKUN */}
      {/* ====================================================================== */}
      {activeTab === 'pengguna' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative min-w-[200px] flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-navy-900"
                />
              </div>

              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 font-medium"
              >
                <option value="">Semua Peran (Role)</option>
                <option value="umkm">Pelaku UMKM</option>
                <option value="staf">Staf Dinas</option>
                <option value="kabid">Kepala Bidang (Kabid)</option>
                <option value="mitra">Mitra Usaha / Offtaker</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-slate-300 font-medium"
              >
                <option value="">Semua Status</option>
                <option value="aktif">Aktif</option>
                <option value="menunggu_persetujuan">Menunggu Verifikasi</option>
                <option value="nonaktif">Nonaktif</option>
                <option value="ditolak">Ditolak</option>
              </select>
            </div>

            <Button
              variant="primary"
              onClick={() => setIsCreateOpen(true)}
              className="gap-2 shrink-0 text-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Staf / Mitra</span>
            </Button>
          </div>

          {/* Tabel Pengguna */}
          <Card>
            <CardContent className="p-0">
              {loadingUsers ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Memuat daftar pengguna...
                </div>
              ) : users.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Tidak ada pengguna yang cocok dengan filter.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Nama & Email</th>
                        <th className="px-4 py-3">Kontak & Instansi</th>
                        <th className="px-4 py-3">Peran (Role)</th>
                        <th className="px-4 py-3">Status Akun</th>
                        <th className="px-4 py-3">ID Kemitraan</th>
                        <th className="px-5 py-3 text-right">Aksi Kabid</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => {
                        const isSelf = u._id === user?.id || u._id === user?._id;

                        return (
                          <tr key={u._id} className="hover:bg-slate-50/50">
                            <td className="px-5 py-4">
                              <p className="font-bold text-navy-900">{u.nama}</p>
                              <p className="text-[11px] text-slate-400">{u.email}</p>
                              {u.mustChangePassword && (
                                <span className="inline-block mt-1 text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-semibold">
                                  Wajib Ganti Sandi
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <p className="font-medium text-slate-700">{u.noHp || '-'}</p>
                              <p className="text-[11px] text-slate-400">{u.instansi || '-'}</p>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                  u.role === 'kabid'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : u.role === 'staf'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : u.role === 'mitra'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {u.role?.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <Badge status={u.status} />
                            </td>
                            <td className="px-4 py-4 font-mono text-[11px] font-bold text-slate-700">
                              {u.mitraId || '-'}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-[11px] px-2 py-1 gap-1"
                                  title="Reset Kata Sandi"
                                  onClick={() => handleResetPassword(u)}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reset</span>
                                </Button>

                                {['staf', 'mitra'].includes(u.role) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-[11px] px-2 py-1 text-slate-600"
                                    onClick={() => {
                                      setRoleTarget(u);
                                      setTargetNewRole(u.role === 'staf' ? 'mitra' : 'staf');
                                    }}
                                  >
                                    Ubah Peran
                                  </Button>
                                )}

                                {!isSelf && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className={`text-[11px] px-2 py-1 ${
                                      u.status === 'aktif'
                                        ? 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                        : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                    }`}
                                    onClick={() => {
                                      setStatusTarget(u);
                                      setTargetNewStatus(u.status === 'aktif' ? 'nonaktif' : 'aktif');
                                    }}
                                  >
                                    {u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ====================================================================== */}
      {/* TAB 2: MATRIKS HAK AKSES */}
      {/* ====================================================================== */}
      {activeTab === 'matriks' && (
        <Card>
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <h3 className="text-base font-extrabold text-navy-900">
              Matriks Otorisasi Berbasis Peran (RBAC) SIPK-Lebak
            </h3>
            <p className="text-xs text-slate-500">
              Konfigurasi hak wewenang akses per fitur untuk menjaga integritas data lintas modul.
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {loadingMatrix ? (
              <div className="py-12 text-center text-slate-400 text-xs">Memuat matriks RBAC...</div>
            ) : !matrixData ? (
              <div className="py-12 text-center text-slate-400 text-xs">Data matriks belum siap.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-3">Modul / Fitur</th>
                      <th className="px-4 py-3 text-center">UMKM</th>
                      <th className="px-4 py-3 text-center">Staf Dinas</th>
                      <th className="px-4 py-3 text-center">Kepala Bidang</th>
                      <th className="px-4 py-3 text-center">Mitra Usaha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(matrixData).map(([featureKey, perm]) => (
                      <tr key={featureKey} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 font-bold text-navy-900">
                          {featureKey.replace(/_/g, ' ').toUpperCase()}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {perm.umkm ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                              {perm.umkm}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {perm.staf ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold text-[11px]">
                              {perm.staf}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {perm.kabid ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold text-[11px]">
                              {perm.kabid}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {perm.mitra ? (
                            <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[11px]">
                              {perm.mitra}
                            </span>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ====================================================================== */}
      {/* TAB 3: LOG AUDIT SISTEM */}
      {/* ====================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Filter className="w-4 h-4 text-slate-400" />
              <span>Filter Tindakan:</span>
              <input
                type="text"
                placeholder="Contoh: CREATE, STATUS, VERIFY..."
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-navy-900"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchAuditLogs} className="text-xs">
              Segarkan Log
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {loadingAudit ? (
                <div className="py-12 text-center text-slate-400 text-xs">Memuat log audit...</div>
              ) : auditLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  Belum ada log aktivitas tercatat.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-5 py-3">Waktu (WIB)</th>
                        <th className="px-4 py-3">Pelaku Aksi</th>
                        <th className="px-4 py-3">Jenis Tindakan</th>
                        <th className="px-4 py-3">Objek / Target</th>
                        <th className="px-5 py-3">Rincian Perubahan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {auditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                            {new Date(log.createdAt || log.timestamp).toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-navy-900">
                              {log.actorId?.nama || log.actorName || 'Sistem'}
                            </p>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              {log.actorRole || log.actorId?.role || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="font-mono font-bold text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {log.action || log.aksi}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            {log.targetModel || log.objectType || '-'}:{' '}
                            <span className="font-mono text-[11px]">
                              {String(log.targetId || log.objectId || '').slice(-6)}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-500 text-[11px] max-w-xs truncate">
                            {typeof log.details === 'object'
                              ? JSON.stringify(log.details)
                              : log.details || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL BUAT AKUN BARU */}
      {/* ====================================================================== */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah Akun Staf Dinas atau Mitra Baru"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Peran Pengguna (Role) <span className="text-rose-500">*</span>
            </label>
            <select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
              className="w-full text-xs px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-navy-900"
            >
              <option value="staf">Staf Verifikator Dinas Koperasi & UMKM</option>
              <option value="mitra">Mitra Usaha / Offtaker Pembeli Komoditas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="Contoh: Abdullah Muchtar"
              value={createForm.nama}
              onChange={(e) => setCreateForm({ ...createForm, nama: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alamat Email Resmi <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              required
              placeholder="Contoh: staf.diskop@lebakkab.go.id"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nomor WhatsApp / Kontak <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              placeholder="0812xxxxxxxx"
              value={createForm.noHp}
              onChange={(e) => setCreateForm({ ...createForm, noHp: e.target.value })}
            />
          </div>

          {createForm.role === 'mitra' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Instansi / Badan Usaha Mitra <span className="text-rose-500">*</span>
              </label>
              <Input
                required
                placeholder="Contoh: PT Sumber Alfaria Trijaya Tbk"
                value={createForm.instansi}
                onChange={(e) => setCreateForm({ ...createForm, instansi: e.target.value })}
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={createSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={createSubmitting}>
              {createSubmitting ? 'Membuat Akun...' : 'Buat Akun & Terbitkan Kata Sandi'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL KATA SANDI SEMENTARA (ALERT PENTING) */}
      {/* ====================================================================== */}
      <Modal
        isOpen={!!newAccountAlert}
        onClose={() => setNewAccountAlert(null)}
        title="Kata Sandi Sementara Berhasil Diterbitkan"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-amber-800">
              <Lock className="w-4 h-4 text-amber-600" />
              Perhatian: Kata sandi ini hanya ditampilkan satu kali!
            </p>
            <p>
              Akun untuk <strong>{newAccountAlert?.user?.nama}</strong> (
              {newAccountAlert?.user?.email}) telah dibuat. Pengguna diwajibkan mengganti kata sandi
              ini saat pertama kali masuk ke sistem.
            </p>
          </div>

          <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-center">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Kata Sandi Sementara (10 Karakter):
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-mono font-black text-navy-900 tracking-wider">
                {newAccountAlert?.tempPassword}
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(newAccountAlert?.tempPassword)}
                className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
                title="Salin Sandi"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="primary" onClick={() => setNewAccountAlert(null)}>
              Saya Sudah Menyimpan Sandi
            </Button>
          </div>
        </div>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL UBAH STATUS / NONAKTIFKAN */}
      {/* ====================================================================== */}
      <Modal
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={targetNewStatus === 'aktif' ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
        size="sm"
      >
        <form onSubmit={handleStatusChange} className="space-y-4">
          <p className="text-xs text-slate-600">
            {targetNewStatus === 'aktif'
              ? `Aktifkan kembali akun "${statusTarget?.nama}". Pengguna akan dapat login kembali.`
              : `Nonaktifkan akun "${statusTarget?.nama}". Pengguna tidak akan dapat mengakses sistem, dan sesinya akan langsung diputus.`}
          </p>

          {targetNewStatus === 'nonaktif' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alasan Penonaktifan <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Pergantian tugas staf / pelanggaran integritas..."
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-navy-900"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStatusTarget(null)}
              disabled={statusSubmitting}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              className={targetNewStatus === 'nonaktif' ? 'bg-rose-600' : 'bg-emerald-600'}
              disabled={statusSubmitting}
            >
              {statusSubmitting ? 'Memproses...' : 'Konfirmasi Ubah Status'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ====================================================================== */}
      {/* MODAL UBAH PERAN (ROLE) */}
      {/* ====================================================================== */}
      <Modal
        isOpen={!!roleTarget}
        onClose={() => setRoleTarget(null)}
        title="Ubah Peran Pengguna (Staf &bull; Mitra)"
        size="sm"
      >
        <form onSubmit={handleRoleChange} className="space-y-4">
          <p className="text-xs text-slate-600">
            Ubah peran pengguna <strong>{roleTarget?.nama}</strong> dari{' '}
            <strong className="uppercase">{roleTarget?.role}</strong> menjadi{' '}
            <strong className="uppercase">{targetNewRole}</strong>.
          </p>
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs">
            Aturan: Pengalihan peran hanya diperbolehkan jika akun belum memiliki catatan transaksi
            terkait di sistem.
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRoleTarget(null)}
              disabled={roleSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" variant="primary" disabled={roleSubmitting}>
              {roleSubmitting ? 'Menyimpan...' : 'Konfirmasi Ubah Peran'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AkunAuditPage;
