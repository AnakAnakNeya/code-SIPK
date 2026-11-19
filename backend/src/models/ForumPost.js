// ============================================================================
// [PBI-13] Model ForumPost (backend/src/models/ForumPost.js)
// PIC: Abdullah | Balasan Diskusi & Jawaban Resmi Fasilitator Dinas
// ============================================================================

import mongoose from 'mongoose';

const forumPostSchema = new mongoose.Schema(
  {
    threadId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumThread',
      required: true,
      index: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
    isi: {
      type: String,
      required: true,
      minlength: 2,
      maxlength: 2000,
      trim: true,
    },
    jawabanResmi: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['aktif', 'disembunyikan'],
      default: 'aktif',
    },
    alasanModerasi: {
      type: String,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export const ForumPost =
  mongoose.models.ForumPost || mongoose.model('ForumPost', forumPostSchema);
export default ForumPost;
