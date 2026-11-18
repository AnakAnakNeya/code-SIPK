import { Product } from '../../models/Product.js';
import { BusinessProfile } from '../../models/BusinessProfile.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import * as kurasiService from '../kurasi/service.js';

export async function listMine(businessId) {
  return Product.find({ businessId }).sort({ createdAt: -1 }).lean();
}

export async function getById(id, businessId) {
  const product = await Product.findOne({ _id: id, businessId }).lean();
  if (!product) throw AppError.notFound('Produk tidak ditemukan');
  return product;
}

export async function createProduct(businessId, userId, data, ip) {
  const profile = await BusinessProfile.findById(businessId);
  if (!profile) throw AppError.notFound('Profil usaha tidak ditemukan');

  const product = await Product.create({
    ...data,
    businessId,
    kategori: profile.kategoriUtama, // Kategori terkunci ke kategori utama usaha (AC-03-03)
    statusKurasi: 'draf',
  });

  await auditLog.write({
    actorId: userId,
    action: 'produk.dibuat',
    entity: 'Product',
    entityId: product._id,
    meta: { nama: product.nama },
    ip,
  });

  return product;
}

export async function updateProduct(id, businessId, userId, changes, ip) {
  const product = await Product.findOne({ _id: id, businessId });
  if (!product) throw AppError.notFound('Produk tidak ditemukan');

  // AC-03-09: setelah diajukan/menunggu, produk terkunci
  if (product.statusKurasi === 'menunggu_verifikasi') {
    throw AppError.conflict('Produk sedang dalam proses verifikasi dinas dan tidak dapat diubah.');
  }

  // AC-03-11: jika sudah terkurasi, hanya boleh ubah harga acuan, kapasitas, deskripsi
  if (product.statusKurasi === 'terkurasi') {
    const allowed = ['hargaAcuan', 'kapasitasBulanan', 'deskripsi'];
    const invalid = Object.keys(changes).filter((k) => !allowed.includes(k));
    if (invalid.length > 0) {
      throw AppError.forbidden(
        `Produk terkurasi hanya dapat mengubah harga acuan, kapasitas, dan deskripsi (field: ${invalid.join(', ')})`,
      );
    }
  }

  Object.assign(product, changes);
  await product.save();

  await auditLog.write({
    actorId: userId,
    action: 'produk.diubah',
    entity: 'Product',
    entityId: product._id,
    meta: { fields: Object.keys(changes) },
    ip,
  });

  return product;
}

export async function deleteProduct(id, businessId, userId, ip) {
  const product = await Product.findOne({ _id: id, businessId });
  if (!product) throw AppError.notFound('Produk tidak ditemukan');

  // AC-03-12: Hanya draf yang boleh dihapus
  if (product.statusKurasi !== 'draf') {
    throw AppError.conflict('Hanya produk berstatus draf yang dapat dihapus.');
  }

  await Product.findByIdAndDelete(id);

  await auditLog.write({
    actorId: userId,
    action: 'produk.dihapus',
    entity: 'Product',
    entityId: id,
    meta: { nama: product.nama },
    ip,
  });

  return { success: true };
}

export async function applyKurasi(id, userId, businessId, ip) {
  return kurasiService.createSubmission(id, userId, businessId, ip);
}
