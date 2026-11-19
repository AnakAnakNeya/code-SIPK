// ============================================================================
// [PBI-11] Service Purchase Order (backend/src/modules/po/service.js)
// PIC: Abdullah | Generator Dokumen Resmi PO Summary PDF Berkop Dinas
// ============================================================================

import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import PurchaseOrder from '../../models/PurchaseOrder.js';
import RFQ from '../../models/RFQ.js';
import RFQAllocation from '../../models/RFQAllocation.js';
import User from '../../models/User.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import { generateCode } from '../../utils/codeGenerator.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import { ROLES } from '../../constants/roles.js';

export const poService = {
  /**
   * AC-11-01 s/d AC-11-07: Generate PO Snapshot & Dokumen PDF
   */
  async generate(rfqId, userId) {
    // 1. Idempoten: Cek apakah PO sudah pernah dibuat
    const existingPo = await PurchaseOrder.findOne({ rfqId });
    if (existingPo) {
      return existingPo;
    }

    // 2. Ambil RFQ & Alokasi Terkonfirmasi
    const rfq = await RFQ.findById(rfqId).populate('mitraUserId');
    if (!rfq) throw new AppError('RFQ tidak ditemukan', 404);

    if (rfq.status !== 'terpenuhi') {
      throw new AppError(
        `PO hanya dapat dibuat untuk RFQ berstatus 'terpenuhi', saat ini '${rfq.status}'`,
        409
      );
    }

    const allocations = await RFQAllocation.find({
      rfqId,
      status: { $in: ['proses_verifikasi', 'terkonfirmasi'] },
    }).populate('businessId', 'namaUsaha kecamatan');

    const alokasiSnapshot = allocations.map((a) => ({
      businessId: a.businessId?._id,
      namaUsaha: a.businessId?.namaUsaha || 'UMKM Lebak',
      kecamatan: a.businessId?.kecamatan || 'Lebak',
      jumlah: a.jumlah,
      nilai: a.nilai,
      tanggalPerkiraanSelesai: a.tanggalPerkiraanSelesai,
    }));

    const totalNilai = alokasiSnapshot.reduce((acc, curr) => acc + curr.nilai, 0);

    // 3. Generate Nomor PO Resmi: PO-RFQ/{tahun}/{romawiBulan}/{seq3}
    const nomor = await generateCode('PO-RFQ');

    // 4. Bangun Objek Snapshot
    const snapshot = {
      rfqKode: rfq.kode,
      mitraNama: rfq.mitraUserId?.nama || 'Mitra Pembeli B2B',
      mitraId: rfq.mitraUserId?.mitraId || 'MTR-LEBAK',
      komoditasNama: rfq.komoditasNama,
      satuan: rfq.satuan,
      kuotaTotal: rfq.kuotaTotal,
      hargaAcuan: rfq.hargaAcuan,
      lokasiKirim: rfq.lokasiKirim,
      catatanMutu: rfq.catatanMutu || '-',
      alokasi: alokasiSnapshot,
      totalNilai,
      verifikatorNama: 'Bidang UMKM Dinkop UKM Kabupaten Lebak',
    };

    // 5. Direktori Penyimpanan PDF
    const poDir = path.resolve(process.cwd(), 'uploads/private/po');
    if (!fs.existsSync(poDir)) {
      fs.mkdirSync(poDir, { recursive: true });
    }
    const pdfPath = path.join(poDir, `${rfq._id}.pdf`);

    // 6. Buat File PDF dengan PDFKit (AC-11-04 s/d AC-11-06)
    await this.renderPdfToFile({ snapshot, nomor, pdfPath });

    // 7. Simpan Dokumen PurchaseOrder ke Database
    const po = await PurchaseOrder.create({
      rfqId: rfq._id,
      nomor,
      snapshot,
      pdfPath,
      generatedBy: userId,
      generatedAt: new Date(),
    });

    await auditLog.write({
      userId,
      action: 'PO_PDF_GENERATED',
      resource: 'PurchaseOrder',
      resourceId: po._id,
      details: { nomor, totalNilai, alokasiCount: alokasiSnapshot.length },
    });

    return po;
  },

  /**
   * Helper Rendering PDF dengan PDFKit
   */
  async renderPdfToFile({ snapshot, nomor, pdfPath }) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const stream = fs.createWriteStream(pdfPath);
      doc.pipe(stream);

      // Kop Surat Resmi Pemerintah Kabupaten Lebak
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('PEMERINTAH KABUPATEN LEBAK', { align: 'center' });
      doc
        .fontSize(14)
        .text('DINAS KOPERASI DAN USAHA KECIL DAN MENENGAH', { align: 'center' });
      doc
        .fontSize(9)
        .font('Helvetica')
        .text(
          'Jl. Abdi Negara No. 3, Rangkasbitung Barat, Kec. Rangkasbitung, Kab. Lebak, Banten 42312',
          { align: 'center' }
        );
      doc
        .fontSize(8)
        .text('Pos-el: dinkopukm@lebakkab.go.id | Laman: dinkopukm.lebakkab.go.id', {
          align: 'center',
        });
      doc.moveDown(0.5);

      // Garis Ganda Pemisah Kop Surat
      const currentY = doc.y;
      doc
        .lineWidth(2)
        .moveTo(40, currentY)
        .lineTo(555, currentY)
        .stroke();
      doc
        .lineWidth(0.5)
        .moveTo(40, currentY + 3)
        .lineTo(555, currentY + 3)
        .stroke();
      doc.moveDown(1.5);

      // Judul Dokumen & Nomor PO
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('PURCHASE ORDER SUMMARY', { align: 'center' });
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('(SURAT KESEPAKATAN PASOKAN BERSAMA KOMODITAS LEBAK)', {
          align: 'center',
        });
      doc.moveDown(0.3);
      doc
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(`Nomor: ${nomor}`, { align: 'center' });
      doc.moveDown(1.2);

      // Informasi Pemesan & Komoditas
      const startX = 40;
      let y = doc.y;

      doc.fontSize(9).font('Helvetica-Bold').text('A. INFORMASI PESANAN (RFQ)', startX, y);
      y += 15;

      const infoRows = [
        ['Kode RFQ', `: ${snapshot.rfqKode}`],
        ['Mitra Pembeli', `: ${snapshot.mitraNama} (ID: ${snapshot.mitraId})`],
        ['Komoditas Usaha', `: ${snapshot.komoditasNama}`],
        ['Volume Total', `: ${snapshot.kuotaTotal.toLocaleString('id-ID')} ${snapshot.satuan}`],
        [
          'Harga Acuan Resmi',
          `: Rp ${snapshot.hargaAcuan.toLocaleString('id-ID')} / ${snapshot.satuan}`,
        ],
        ['Lokasi Pengiriman', `: ${snapshot.lokasiKirim}`],
        ['Catatan Mutu', `: ${snapshot.catatanMutu}`],
      ];

      doc.font('Helvetica');
      infoRows.forEach(([label, val]) => {
        doc.font('Helvetica-Bold').text(label, startX + 10, y, { width: 130 });
        doc.font('Helvetica').text(val, startX + 140, y, { width: 370 });
        y += 14;
      });

      y += 10;
      doc.font('Helvetica-Bold').text('B. RINCIAN ALOKASI PASOKAN UMKM', startX, y);
      y += 15;

      // Header Tabel Alokasi
      doc.rect(startX, y, 515, 20).fillAndStroke('#f1f5f9', '#94a3b8');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5);
      doc.text('No', startX + 5, y + 6, { width: 25, align: 'center' });
      doc.text('Nama Pelaku UMKM', startX + 35, y + 6, { width: 175 });
      doc.text('Kecamatan', startX + 215, y + 6, { width: 100 });
      doc.text('Jumlah Pasokan', startX + 320, y + 6, { width: 90, align: 'right' });
      doc.text('Nilai Kontrak (Rp)', startX + 415, y + 6, { width: 95, align: 'right' });

      y += 20;

      // Isi Tabel Alokasi
      doc.font('Helvetica').fontSize(8);
      snapshot.alokasi.forEach((row, idx) => {
        const fillColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(startX, y, 515, 18).fillAndStroke(fillColor, '#cbd5e1');
        doc.fillColor('#1e293b');

        doc.text(String(idx + 1), startX + 5, y + 5, { width: 25, align: 'center' });
        doc.text(row.namaUsaha, startX + 35, y + 5, { width: 175 });
        doc.text(row.kecamatan, startX + 215, y + 5, { width: 100 });
        doc.text(
          `${row.jumlah.toLocaleString('id-ID')} ${snapshot.satuan}`,
          startX + 320,
          y + 5,
          { width: 90, align: 'right' }
        );
        doc.text(
          `Rp ${row.nilai.toLocaleString('id-ID')}`,
          startX + 415,
          y + 5,
          { width: 95, align: 'right' }
        );
        y += 18;
      });

      // Baris Total
      doc.rect(startX, y, 515, 20).fillAndStroke('#e2e8f0', '#64748b');
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(8.5);
      doc.text('TOTAL PASOKAN & NILAI KESEPAKATAN', startX + 35, y + 6, { width: 275 });
      doc.text(
        `${snapshot.kuotaTotal.toLocaleString('id-ID')} ${snapshot.satuan}`,
        startX + 320,
        y + 6,
        { width: 90, align: 'right' }
      );
      doc.text(
        `Rp ${snapshot.totalNilai.toLocaleString('id-ID')}`,
        startX + 415,
        y + 6,
        { width: 95, align: 'right' }
      );

      y += 35;

      // Tiga Blok Tanda Tangan (AC-11-06)
      const tglWIB = new Date().toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

      doc.fillColor('#0f172a').font('Helvetica').fontSize(8);
      doc.text(`Rangkasbitung, ${tglWIB}`, 380, y, { align: 'center', width: 170 });
      y += 15;

      const col1X = 40;
      const col2X = 210;
      const col3X = 380;
      const colWidth = 170;

      doc.font('Helvetica-Bold');
      doc.text('Perwakilan Pelaku UMKM,', col1X, y, { align: 'center', width: colWidth });
      doc.text('Verifikator Bidang UMKM,', col2X, y, { align: 'center', width: colWidth });
      doc.text('Manajer Pengadaan Mitra,', col3X, y, { align: 'center', width: colWidth });

      y += 50;

      doc.font('Helvetica-Bold');
      const firstUmkmName = snapshot.alokasi[0]?.namaUsaha || 'Pelaku UMKM Lebak';
      doc.text(`( ${firstUmkmName} )`, col1X, y, { align: 'center', width: colWidth });
      doc.text('( Juli Zakiah, S.Sos., M.Si. )', col2X, y, { align: 'center', width: colWidth });
      doc.text(`( ${snapshot.mitraNama} )`, col3X, y, { align: 'center', width: colWidth });

      y += 12;
      doc.font('Helvetica').fontSize(7.5).fillColor('#64748b');
      doc.text('Koordinator Pasokan Bersama', col1X, y, { align: 'center', width: colWidth });
      doc.text('NIP. 19740512 200212 2 004', col2X, y, { align: 'center', width: colWidth });
      doc.text(`ID Mitra: ${snapshot.mitraId}`, col3X, y, { align: 'center', width: colWidth });

      doc.end();
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  },

  /**
   * AC-11-09: Ambil Metadata PO Berdasarkan RFQ ID
   */
  async getByRfqId(rfqId, user) {
    const po = await PurchaseOrder.findOne({ rfqId });
    if (!po) {
      throw new AppError('Dokumen Purchase Order belum diterbitkan untuk RFQ ini', 404);
    }
    await this.checkPoAccess(po, user);
    return po;
  },

  /**
   * Detail PO Snapshot
   */
  async getById(id, user) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw new AppError('Dokumen Purchase Order tidak ditemukan', 404);
    await this.checkPoAccess(po, user);
    return po;
  },

  /**
   * AC-11-09: Stream Dokumen PDF
   */
  async getPdfPath(id, user) {
    const po = await PurchaseOrder.findById(id);
    if (!po) throw new AppError('Dokumen Purchase Order tidak ditemukan', 404);
    await this.checkPoAccess(po, user);

    if (!fs.existsSync(po.pdfPath)) {
      // Re-generate file if missing
      await this.renderPdfToFile({
        snapshot: po.snapshot,
        nomor: po.nomor,
        pdfPath: po.pdfPath,
      });
    }

    return { po, pdfPath: po.pdfPath };
  },

  /**
   * Pengecekan Hak Akses PO (AC-11-09)
   */
  async checkPoAccess(po, user) {
    if ([ROLES.STAF, ROLES.KABID].includes(user.role)) return true;

    const rfq = await RFQ.findById(po.rfqId);
    if (!rfq) throw new AppError('RFQ terkait tidak ditemukan', 404);

    if (user.role === ROLES.MITRA) {
      if (String(rfq.mitraUserId) !== String(user.id)) {
        throw new AppError('Anda bukan pemilik RFQ dokumen PO ini', 403);
      }
      return true;
    }

    if (user.role === ROLES.UMKM) {
      const profile = await BusinessProfile.findOne({ userId: user.id });
      if (!profile) throw new AppError('Profil usaha tidak ditemukan', 403);

      const isParticipant = await RFQAllocation.exists({
        rfqId: po.rfqId,
        businessId: profile._id,
        status: 'terkonfirmasi',
      });

      if (!isParticipant) {
        throw new AppError(
          'Hanya UMKM yang terkonfirmasi dalam alokasi yang dapat mengakses dokumen PO ini',
          403
        );
      }
      return true;
    }

    throw new AppError('Akses ditolak', 403);
  },
};

export default poService;
