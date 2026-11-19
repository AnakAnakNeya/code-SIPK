// ============================================================================
// [PBI-11] Controller Purchase Order (backend/src/modules/po/controller.js)
// PIC: Abdullah
// ============================================================================

import path from 'path';
import poService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export const poController = {
  async getByRfqId(req, res, next) {
    try {
      const data = await poService.getByRfqId(req.params.rfqId, req.user);
      return sendSuccess(res, 200, 'Metadata PO berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const data = await poService.getById(req.params.id, req.user);
      return sendSuccess(res, 200, 'Detail snapshot PO berhasil diambil', data);
    } catch (err) {
      next(err);
    }
  },

  async downloadPdf(req, res, next) {
    try {
      const { po, pdfPath } = await poService.getPdfPath(req.params.id, req.user);
      const filename = `PO_${po.nomor.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      return res.sendFile(path.resolve(pdfPath));
    } catch (err) {
      next(err);
    }
  },
};

export default poController;
