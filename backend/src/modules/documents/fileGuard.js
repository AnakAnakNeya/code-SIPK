// ============================================================================
// [PBI-02] Guard unggahan dokumen: error ukuran jelas + cek isi file (magic bytes)
// ============================================================================
import fs from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { uploadDoc } from '../../middleware/upload.js';
import { AppError } from '../../utils/AppError.js';

function detectType(buf) {
  if (buf.length >= 4 && buf.toString('latin1', 0, 4) === '%PDF') {
    return { mime: 'application/pdf', ext: '.pdf' };
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }
  return null;
}

export function singleDocFile(req, res, next) {
  uploadDoc.single('file')(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(
            new AppError(422, 'FILE_TOO_LARGE', 'Ukuran berkas melebihi 2 MB. Perkecil berkas lalu unggah ulang.'),
          );
        }
        return next(
          new AppError(422, 'INVALID_UPLOAD', 'Berkas gagal diunggah. Pastikan hanya satu berkas pada kolom "file".'),
        );
      }
      return next(err);
    }
    if (!req.file) return next(); // controller yang menolak dengan FILE_REQUIRED

    try {
      const fh = await fs.open(req.file.path, 'r');
      const buf = Buffer.alloc(8);
      await fh.read(buf, 0, 8, 0);
      await fh.close();

      const type = detectType(buf);
      if (!type) {
        await fs.unlink(req.file.path).catch(() => {});
        return next(new AppError(422, 'INVALID_FILE_TYPE', 'Isi berkas bukan PDF atau JPG yang valid.'));
      }

      // samakan ekstensi dan mime dengan isi file yang sebenarnya
      const p = path.parse(req.file.path);
      const fixedPath = path.join(p.dir, p.name + type.ext);
      if (fixedPath !== req.file.path) {
        await fs.rename(req.file.path, fixedPath);
        req.file.path = fixedPath;
      }
      req.file.mimetype = type.mime;
      return next();
    } catch (e) {
      return next(e);
    }
  });
}
