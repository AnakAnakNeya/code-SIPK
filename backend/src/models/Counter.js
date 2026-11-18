import mongoose from 'mongoose';

// Koleksi `counters` untuk penomoran atomik (PRD Sprint 1, Seksi 4.5).
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export default mongoose.models.Counter || mongoose.model('Counter', counterSchema);
