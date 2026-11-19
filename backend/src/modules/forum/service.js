// ============================================================================
// [PBI-13] Service Forum (backend/src/modules/forum/service.js)
// PIC: Abdullah | Forum Komunitas UMKM & Tanya Jawab Konsultan Dinas Lebak
// ============================================================================

import ForumThread from '../../models/ForumThread.js';
import ForumPost from '../../models/ForumPost.js';
import BusinessProfile from '../../models/BusinessProfile.js';
import { AppError } from '../../utils/AppError.js';
import { auditLog } from '../../utils/auditLog.js';
import { ROLES } from '../../constants/roles.js';

export const forumService = {
  /**
   * AC-13-01 s/d AC-13-03: Daftar Thread dengan Filter Kategori & Pencarian
   */
  async listThreads({ kategori, kecamatan, q, page = 1, limit = 20 }) {
    const filter = { status: 'aktif' };
    if (kategori) filter.kategori = kategori;
    if (kecamatan) filter.authorKecamatan = kecamatan;
    if (q) {
      filter.$or = [
        { judul: { $regex: q, $options: 'i' } },
        { isi: { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (Math.max(1, page) - 1) * limit;

    const [items, total] = await Promise.all([
      ForumThread.find(filter)
        .sort({ pinned: -1, lastActivityAt: -1 })
        .skip(skip)
        .limit(limit),
      ForumThread.countDocuments(filter),
    ]);

    return {
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * AC-13-04: Buat Thread Baru
   */
  async createThread({ judul, isi, kategori, user }) {
    // Kategori pengumuman_dinas hanya untuk staf dan kabid
    if (kategori === 'pengumuman_dinas' && ![ROLES.STAF, ROLES.KABID].includes(user.role)) {
      throw new AppError('Kategori Pengumuman Dinas hanya dapat dibuat oleh staf dinas', 403);
    }

    let kecamatan = 'Lebak';
    let authorNama = user.nama;

    if (user.role === ROLES.UMKM) {
      const profile = await BusinessProfile.findOne({ userId: user.id });
      if (profile) {
        kecamatan = profile.kecamatan;
        authorNama = `${user.nama} (${profile.namaUsaha})`;
      }
    } else {
      authorNama = `${user.nama} (Dinas Koperasi & UKM)`;
    }

    const thread = await ForumThread.create({
      judul,
      isi,
      kategori,
      authorId: user.id,
      authorRole: user.role,
      authorNama,
      authorKecamatan: kecamatan,
      lastActivityAt: new Date(),
    });

    await auditLog.write({
      userId: user.id,
      action: 'FORUM_THREAD_CREATED',
      resource: 'ForumThread',
      resourceId: thread._id,
      details: { judul, kategori },
    });

    return thread;
  },

  /**
   * AC-13-10: Detail Thread & Balasan
   */
  async getThreadById(id) {
    const thread = await ForumThread.findById(id);
    if (!thread || thread.status === 'disembunyikan') {
      throw new AppError('Topik diskusi tidak ditemukan', 404);
    }

    const posts = await ForumPost.find({ threadId: id, status: 'aktif' }).sort({
      createdAt: 1,
    });

    return { thread, posts };
  },

  /**
   * AC-13-09: Edit Thread (Dalam 15 Menit)
   */
  async updateThread(id, { judul, isi }, userId) {
    const thread = await ForumThread.findById(id);
    if (!thread) throw new AppError('Thread tidak ditemukan', 404);

    if (String(thread.authorId) !== String(userId)) {
      throw new AppError('Anda bukan penulis topik ini', 403);
    }

    const diffMinutes = (Date.now() - new Date(thread.createdAt).getTime()) / 60000;
    if (diffMinutes > 15) {
      throw new AppError('Topik hanya dapat disunting dalam 15 menit setelah dibuat', 409);
    }

    if (judul) thread.judul = judul;
    if (isi) thread.isi = isi;
    await thread.save();

    return thread;
  },

  async deleteThread(id, userId) {
    const thread = await ForumThread.findById(id);
    if (!thread) throw new AppError('Thread tidak ditemukan', 404);

    if (String(thread.authorId) !== String(userId)) {
      throw new AppError('Anda bukan penulis topik ini', 403);
    }

    await ForumThread.findByIdAndDelete(id);
    await ForumPost.deleteMany({ threadId: id });
    return { message: 'Topik diskusi berhasil dihapus' };
  },

  /**
   * AC-13-04: Kirim Balasan Diskusi
   */
  async createPost({ threadId, isi, user }) {
    const thread = await ForumThread.findById(threadId);
    if (!thread || thread.status === 'disembunyikan') {
      throw new AppError('Topik diskusi tidak ditemukan', 404);
    }

    let kecamatan = 'Lebak';
    let authorNama = user.nama;

    if (user.role === ROLES.UMKM) {
      const profile = await BusinessProfile.findOne({ userId: user.id });
      if (profile) {
        kecamatan = profile.kecamatan;
        authorNama = `${user.nama} (${profile.namaUsaha})`;
      }
    } else {
      authorNama = `${user.nama} (Dinas Koperasi & UKM)`;
    }

    const post = await ForumPost.create({
      threadId,
      authorId: user.id,
      authorRole: user.role,
      authorNama,
      authorKecamatan: kecamatan,
      isi,
      status: 'aktif',
    });

    // Update counter dan aktivitas terakhir pada thread
    thread.replyCount += 1;
    thread.lastActivityAt = new Date();
    await thread.save();

    return post;
  },

  /**
   * AC-13-09: Edit Balasan (Dalam 15 Menit)
   */
  async updatePost(id, { isi }, userId) {
    const post = await ForumPost.findById(id);
    if (!post) throw new AppError('Balasan tidak ditemukan', 404);

    if (String(post.authorId) !== String(userId)) {
      throw new AppError('Anda bukan penulis balasan ini', 403);
    }

    const diffMinutes = (Date.now() - new Date(post.createdAt).getTime()) / 60000;
    if (diffMinutes > 15) {
      throw new AppError('Balasan hanya dapat disunting dalam 15 menit setelah dibuat', 409);
    }

    post.isi = isi;
    await post.save();
    return post;
  },

  async deletePost(id, userId) {
    const post = await ForumPost.findById(id);
    if (!post) throw new AppError('Balasan tidak ditemukan', 404);

    if (String(post.authorId) !== String(userId)) {
      throw new AppError('Anda bukan penulis balasan ini', 403);
    }

    await ForumPost.findByIdAndDelete(id);
    await ForumThread.updateOne({ _id: post.threadId }, { $inc: { replyCount: -1 } });
    return { message: 'Balasan berhasil dihapus' };
  },

  /**
   * AC-13-06: Sematkan Thread (Maksimal 3 Thread Sekaligus)
   */
  async pinThread(id, stafId) {
    const pinnedCount = await ForumThread.countDocuments({ pinned: true, status: 'aktif' });
    if (pinnedCount >= 3) {
      throw new AppError('Maksimal 3 topik yang dapat disematkan sekaligus', 409);
    }

    const thread = await ForumThread.findByIdAndUpdate(
      id,
      {
        pinned: true,
        pinnedBy: stafId,
        pinnedAt: new Date(),
      },
      { new: true }
    );

    return thread;
  },

  async unpinThread(id) {
    return ForumThread.findByIdAndUpdate(
      id,
      { pinned: false, pinnedBy: null, pinnedAt: null },
      { new: true }
    );
  },

  /**
   * AC-13-07: Tandai Jawaban Resmi Dinas
   */
  async markOfficialAnswer(postId, stafId) {
    const post = await ForumPost.findById(postId);
    if (!post) throw new AppError('Balasan tidak ditemukan', 404);

    if (![ROLES.STAF, ROLES.KABID].includes(post.authorRole)) {
      throw new AppError('Hanya jawaban dari staf dinas yang dapat ditandai sebagai resmi', 422);
    }

    // Reset jawaban resmi lama pada thread ini
    await ForumPost.updateMany({ threadId: post.threadId }, { jawabanResmi: false });

    post.jawabanResmi = true;
    await post.save();

    await ForumThread.findByIdAndUpdate(post.threadId, {
      terjawabDinas: true,
      jawabanResmiPostId: post._id,
    });

    return post;
  },

  /**
   * AC-13-08: Moderasi Sembunyikan Thread / Balasan
   */
  async hideThread(id, { alasan }, stafId) {
    const thread = await ForumThread.findById(id);
    if (!thread) throw new AppError('Thread tidak ditemukan', 404);

    thread.status = 'disembunyikan';
    await thread.save();

    await auditLog.write({
      userId: stafId,
      action: 'FORUM_THREAD_HIDDEN',
      resource: 'ForumThread',
      resourceId: thread._id,
      details: { alasan },
    });

    return thread;
  },

  async hidePost(id, { alasan }, stafId) {
    const post = await ForumPost.findById(id);
    if (!post) throw new AppError('Balasan tidak ditemukan', 404);

    post.status = 'disembunyikan';
    post.alasanModerasi = alasan;
    post.moderatedBy = stafId;
    await post.save();

    await auditLog.write({
      userId: stafId,
      action: 'FORUM_POST_HIDDEN',
      resource: 'ForumPost',
      resourceId: post._id,
      details: { alasan },
    });

    return post;
  },
};

export default forumService;
