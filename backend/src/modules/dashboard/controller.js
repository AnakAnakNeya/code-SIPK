// ============================================================================
// [PBI-15] Controller Dashboard (backend/src/modules/dashboard/controller.js)
// PIC: Naila
// ============================================================================

import dashboardService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const dashboardController = {
  async getDinas(req, res, next) {
    try {
      const data = await dashboardService.getDinasKpi(req.query.periode || '30d');
      return sendSuccess(res, 200, 'KPI dan metrik analitik dinas berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async getUmkm(req, res, next) {
    try {
      const data = await dashboardService.getUmkmSummary(req.user.id);
      return sendSuccess(res, 200, 'Ringkasan dasbor UMKM berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },
};

export default dashboardController;
