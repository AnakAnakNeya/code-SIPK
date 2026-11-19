// ============================================================================
// [PBI-13] Model ForumThread (backend/src/models/ForumThread.js)
// PIC: Abdullah | Topik Diskusi Komunitas & Pengumuman Resmi Dinas
// ============================================================================

import mongoose from 'mongoose';

const forumThreadSchema = new mongoose.Schema(
  {
    judul: {
      type: String,
      required: true,
      minlength: 10,
      maxlength: 150,
      trim: true,
    },
    isi: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 3000,
      trim: true,
    },
    kategori: {
      type: String,
      required: true,
      index: true,
      enum: [
        'pengumuman_dinas',
        'legalitas_perizinan',
        'kemasan',
        'bahan_baku',
        'kolaborasi_pasokan',
        'umum',
      ],
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorRole: {
      type: String,
      required: true,
    },
    authorNama: {
      type: String,
      required: true,
    },
    authorKecamatan: {
      type: String,
      default: 'Lebak',
    },
    pinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    pinnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pinnedAt: {
      type: Date,
    },
    terjawabDinas: {
      type: Boolean,
      default: false,
    },
    jawabanResmiPostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumPost',
    },
    status: {
      type: String,
      enum: ['aktif', 'disembunyikan'],
      default: 'aktif',
      index: true,
    },
    replyCount: {
      type: Number,
      default: 0,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export const ForumThread =
  mongoose.models.ForumThread || mongoose.model('ForumThread', forumThreadSchema);
export default ForumThread;
