import mongoose from 'mongoose';

// Append-only: tidak ada update/delete (PRD Sprint 1, Seksi 4.6).
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, required: true, index: true },
    entity: { type: String },
    entityId: { type: String },
    meta: { type: mongoose.Schema.Types.Mixed },
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const blocked = function () {
  throw new Error('AuditLog bersifat append-only.');
};
['updateOne', 'updateMany', 'findOneAndUpdate', 'findOneAndDelete', 'deleteOne', 'deleteMany', 'replaceOne'].forEach(
  (op) => auditLogSchema.pre(op, blocked),
);

export default mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
