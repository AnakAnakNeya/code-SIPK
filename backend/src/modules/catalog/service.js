import mongoose from 'mongoose';
import { Product } from '../../models/Product.js';
import { BusinessProfile } from '../../models/BusinessProfile.js';
import { AppError } from '../../utils/AppError.js';

export async function listProducts({
  q,
  kategori,
  kecamatan,
  grade,
  sort = 'terbaru',
  page = 1,
  limit = 12,
}) {
  const match = { statusKurasi: 'terkurasi' };
  if (kategori && kategori !== 'all') match.kategori = kategori;
  if (grade && grade !== 'all') match.gradeKurasi = grade;

  const pipeline = [
    { $match: match },
    {
      $lookup: {
        from: 'businessprofiles',
        localField: 'businessId',
        foreignField: '_id',
        as: 'usaha',
      },
    },
    { $unwind: '$usaha' },
  ];

  if (kecamatan && kecamatan !== 'all') {
    pipeline.push({ $match: { 'usaha.kecamatan': kecamatan } });
  }

  if (q && q.trim()) {
    const rx = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    pipeline.push({
      $match: {
        $or: [{ nama: rx }, { deskripsi: rx }, { 'usaha.namaUsaha': rx }, { subKomoditas: rx }],
      },
    });
  }

  // Sorting
  const sortMap = {
    terbaru: { createdAt: -1 },
    harga_terendah: { hargaAcuan: 1 },
    harga_tertinggi: { hargaAcuan: -1 },
  };
  pipeline.push({ $sort: sortMap[sort] || sortMap.terbaru });

  // Facet untuk pagination
  const skip = (Math.max(1, page) - 1) * limit;
  pipeline.push({
    $facet: {
      items: [{ $skip: skip }, { $limit: Number(limit) }],
      total: [{ $count: 'count' }],
    },
  });

  const [res] = await Product.aggregate(pipeline);
  const total = res.total[0]?.count || 0;

  // DTO Publik (AC-05-08: label izin ada/tidak, tanpa path file privat)
  const items = (res.items || []).map((p) => ({
    id: String(p._id),
    nama: p.nama,
    kategori: p.kategori,
    subKomoditas: p.subKomoditas,
    satuan: p.satuan,
    hargaAcuan: p.hargaAcuan,
    kapasitasBulanan: p.kapasitasBulanan,
    deskripsi: p.deskripsi,
    fotos: p.fotos || [],
    gradeKurasi: p.gradeKurasi,
    terkurasiAt: p.terkurasiAt,
    nomorSK: p.nomorSK,
    usaha: {
      namaUsaha: p.usaha.namaUsaha,
      kecamatan: p.usaha.kecamatan,
      kategoriUtama: p.usaha.kategoriUtama,
      tahunMulai: p.usaha.tahunMulai,
    },
  }));

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getProductById(id) {
  const product = await Product.findOne({ _id: id, statusKurasi: 'terkurasi' })
    .populate('businessId', 'namaUsaha kecamatan alamat tahunMulai kategoriUtama')
    .lean();
  if (!product) throw AppError.notFound('Produk tidak ditemukan dalam katalog terkurasi');
  return product;
}

export async function getContact(id) {
  const product = await Product.findById(id).populate('businessId', 'namaUsaha waUsaha');
  if (!product || !product.businessId) throw AppError.notFound('Kontak usaha tidak ditemukan');
  return {
    namaUsaha: product.businessId.namaUsaha,
    waUsaha: product.businessId.waUsaha,
  };
}
