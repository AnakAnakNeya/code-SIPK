// ============================================================================
// [PBI-11] Modal Pratinjau Dokumen PO Summary (frontend/src/pages/shared/po/PoViewModal.jsx)
// Lembar format A4 berkop resmi Dinas Koperasi & UKM Lebak + Unduh PDF + Cetak
// ============================================================================

import React, { useState, useEffect } from 'react';
import { Download, Printer, X, FileText, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { Modal } from '../../../components/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import api from '../../../services/api.js';

export function PoViewModal({ isOpen, onClose, rfqId, poId }) {
  const [loading, setLoading] = useState(false);
  const [poData, setPoData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || (!rfqId && !poId)) return;

    const fetchPo = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint = poId ? `/po/${poId}` : `/po/by-rfq/${rfqId}`;
        const res = await api.get(endpoint);
        setPoData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.error?.message || 'Gagal memuat dokumen PO');
      } finally {
        setLoading(false);
      }
    };

    fetchPo();
  }, [isOpen, rfqId, poId]);

  const handleDownloadPdf = async () => {
    if (!poData?._id) return;
    try {
      const res = await api.get(`/po/${poData._id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `PO_${poData.nomor.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Gagal mengunduh dokumen PDF');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pratinjau Resmi Purchase Order Summary (PO)"
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500 font-mono">
            Status: Dokumen Sah & Divalidasi Dinas
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1.5" />
              Cetak Dokumen
            </Button>
            <Button size="sm" onClick={handleDownloadPdf} className="bg-navy-900 hover:bg-navy-800 text-white">
              <Download className="w-4 h-4 mr-1.5" />
              Unduh Dokumen (.PDF)
            </Button>
          </div>
        </div>
      }
    >
      {loading && (
        <div className="py-16 text-center space-y-3">
          <div className="w-8 h-8 border-3 border-navy-900 border-t-amber-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Memuat berkas Purchase Order resmi...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-900 rounded-xl border border-red-200 text-xs">
          <strong>Perhatian:</strong> {error}
        </div>
      )}

      {poData && !loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-xs max-w-3xl mx-auto space-y-6 text-slate-800 text-xs print:p-0 print:border-none print:shadow-none">
          {/* Kop Dinas Lebak */}
          <div className="text-center border-b-2 border-slate-900 pb-4 space-y-1">
            <h2 className="text-sm font-bold tracking-wider text-slate-900 uppercase">
              Pemerintah Kabupaten Lebak
            </h2>
            <h1 className="text-base font-extrabold text-navy-950 uppercase">
              Dinas Koperasi dan Usaha Kecil dan Menengah
            </h1>
            <p className="text-[11px] text-slate-600">
              Jl. Abdi Negara No. 3, Rangkasbitung Barat, Kec. Rangkasbitung, Kab. Lebak, Banten 42312
            </p>
            <p className="text-[10px] text-slate-500">
              Pos-el: dinkopukm@lebakkab.go.id | Laman: dinkopukm.lebakkab.go.id
            </p>
            <div className="pt-2 border-b border-slate-400" />
          </div>

          {/* Judul & Nomor PO */}
          <div className="text-center space-y-1">
            <h3 className="text-sm font-black tracking-wide text-navy-900 uppercase">
              PURCHASE ORDER SUMMARY
            </h3>
            <p className="text-[11px] font-semibold text-slate-700">
              (SURAT KESEPAKATAN PASOKAN BERSAMA KOMODITAS LEBAK)
            </p>
            <p className="text-xs font-mono font-bold text-amber-700 mt-1">
              Nomor: {poData.nomor}
            </p>
          </div>

          {/* Informasi RFQ & Pemesan */}
          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-2">
            <h4 className="font-bold text-xs text-navy-950 uppercase tracking-wide">
              A. Informasi Pesanan & Mitra Pengadaan
            </h4>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="text-slate-500 block text-[11px]">Kode RFQ:</span>
                <span className="font-semibold text-slate-900">{poData.snapshot?.rfqKode}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Mitra Pembeli:</span>
                <span className="font-semibold text-slate-900">
                  {poData.snapshot?.mitraNama} ({poData.snapshot?.mitraId || 'ID MITRA'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Komoditas Usaha:</span>
                <span className="font-semibold text-slate-900">{poData.snapshot?.komoditasNama}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Volume Total Pesanan:</span>
                <span className="font-semibold text-slate-900">
                  {poData.snapshot?.kuotaTotal?.toLocaleString('id-ID')} {poData.snapshot?.satuan}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Harga Acuan Resmi Dinas:</span>
                <span className="font-semibold text-slate-900">
                  Rp {poData.snapshot?.hargaAcuan?.toLocaleString('id-ID')} / {poData.snapshot?.satuan}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Lokasi Penyerahan:</span>
                <span className="font-semibold text-slate-900">{poData.snapshot?.lokasiKirim}</span>
              </div>
            </div>
            {poData.snapshot?.catatanMutu && (
              <div className="pt-1">
                <span className="text-slate-500 block text-[11px]">Spesifikasi / Catatan Mutu:</span>
                <span className="text-slate-700 italic">{poData.snapshot?.catatanMutu}</span>
              </div>
            )}
          </div>

          {/* Tabel Alokasi Pasokan Bersama */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs text-navy-950 uppercase tracking-wide">
              B. Rincian Alokasi Pasokan Kolektif Pelaku UMKM
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-10">No</th>
                    <th className="py-2.5 px-3">Nama Pelaku UMKM</th>
                    <th className="py-2.5 px-3">Kecamatan</th>
                    <th className="py-2.5 px-3 text-right">Volume Pasokan</th>
                    <th className="py-2.5 px-3 text-right">Nilai Transaksi (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {poData.snapshot?.alokasi?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.namaUsaha}</td>
                      <td className="py-2 px-3 text-slate-600">{item.kecamatan}</td>
                      <td className="py-2 px-3 text-right font-medium">
                        {item.jumlah?.toLocaleString('id-ID')} {poData.snapshot?.satuan}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-navy-950">
                        Rp {item.nilai?.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={3} className="py-2.5 px-3 uppercase text-right">
                      Total Pasokan & Nilai Transaksi:
                    </td>
                    <td className="py-2.5 px-3 text-right text-amber-900">
                      {poData.snapshot?.kuotaTotal?.toLocaleString('id-ID')} {poData.snapshot?.satuan}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-800 text-sm">
                      Rp {poData.snapshot?.totalNilai?.toLocaleString('id-ID')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tanda Tangan 3 Pihak */}
          <div className="pt-6 space-y-4">
            <p className="text-right text-[11px] text-slate-600">
              Rangkasbitung, {new Date(poData.generatedAt || Date.now()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-semibold text-slate-700">Perwakilan UMKM Lebak,</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">
                  {poData.snapshot?.alokasi?.[0]?.namaUsaha || 'Pelaku UMKM Lebak'}
                </p>
                <p className="text-[10px] text-slate-500">Koordinator Pasokan</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700">Verifikator Bidang UMKM,</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">Juli Zakiah, S.Sos., M.Si.</p>
                <p className="text-[10px] text-slate-500">NIP. 19740512 200212 2 004</p>
              </div>

              <div>
                <p className="font-semibold text-slate-700">Manajer Pengadaan Mitra,</p>
                <div className="h-16" />
                <p className="font-bold underline text-slate-900">{poData.snapshot?.mitraNama}</p>
                <p className="text-[10px] text-slate-500">ID: {poData.snapshot?.mitraId || 'MITRA'}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default PoViewModal;
