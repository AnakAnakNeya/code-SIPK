import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const DOCS_DIR = path.resolve('uploads/private/docs');
const PRODUCTS_DIR = path.resolve('uploads/public/products');

// Pastikan direktori dasar ada
fs.mkdirSync(DOCS_DIR, { recursive: true });
fs.mkdirSync(PRODUCTS_DIR, { recursive: true });

// Storage untuk dokumen izin legalitas UMKM (private)
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const businessId = String(req.businessId || 'temp');
    const targetDir = path.join(DOCS_DIR, businessId);
    fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomUUID();
    cb(null, `${unique}${ext}`);
  },
});

export const uploadDoc = multer({
  storage: docStorage,
  limits: {
    fileSize: 2 * 1024 * 1024, // Maksimal 2 MB (AC-02-03)
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(
        AppError.validation(
          'Format berkas tidak didukung. Unggah berkas dalam format PDF atau JPG/PNG.',
          'INVALID_FILE_TYPE',
        ),
      );
    }
  },
});

// Storage untuk foto produk (public)
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const productId = String(req.params.id || 'temp');
    const targetDir = path.join(PRODUCTS_DIR, productId);
    fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomUUID();
    cb(null, `${unique}${ext}`);
  },
});

export const uploadProductPhotos = multer({
  storage: productStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimal 5 MB (AC-03-04)
  },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype.toLowerCase())) {
      cb(null, true);
    } else {
      cb(
        AppError.validation(
          'Format foto tidak didukung. Unggah foto dalam format JPG, PNG, atau WebP.',
          'INVALID_FILE_TYPE',
        ),
      );
    }
  },
});
