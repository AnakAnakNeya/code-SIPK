import mongoose from 'mongoose';
import { GRADE, KATEGORI, STATUS_PRODUK } from '../constants/enums.js';
import { slugify } from '../utils/slug.js';

const fotoSubSchema = new mongoose.Schema(
  {
    path: { type: String, required: true },
    thumb: { type: String, required: true },
    ukuran: { type: Number, required: true },
    urutan: { type: Number, default: 0 },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BusinessProfile',
      required: true,
      index: true,
    },
    nama: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 120,
      trim: true,
    },
    varian: {
      type: [String],
      default: [],
    },
    kategori: {
      type: String,
      enum: Object.values(KATEGORI),
      required: true,
      index: true,
    },
    subKomoditas: {
      type: String,
      required: true,
      trim: true,
    },
    subKomoditasSlug: {
      type: String,
      index: true,
    },
    satuan: {
      type: String,
      required: true,
      trim: true,
    },
    hargaAcuan: {
      type: Number,
      required: true,
      min: 1000,
    },
    kapasitasBulanan: {
      type: Number,
      required: true,
      min: 1,
    },
    deskripsi: {
      type: String,
      required: true,
      minlength: 30,
      trim: true,
    },
    fotos: {
      type: [fotoSubSchema],
      default: [],
    },
    statusKurasi: {
      type: String,
      enum: STATUS_PRODUK,
      default: 'draf',
      index: true,
    },
    gradeKurasi: {
      type: String,
      enum: GRADE,
    },
    terkurasiAt: {
      type: Date,
    },
    nomorSK: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

productSchema.pre('save', function (next) {
  if (this.isModified('subKomoditas') && this.subKomoditas) {
    this.subKomoditasSlug = slugify(this.subKomoditas);
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
export default Product;
