// ============================================================================
// Service Integrasi API Axios (frontend/src/services/api.js)
// Konfigurasi HTTP Client tersentralisasi ke REST API Backend SIPK-Lebak
// ============================================================================

import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Terjadi kesalahan pada jaringan.',
    };
    return Promise.reject(customError);
  },
);

export default api;
