import AuditLog from '../models/AuditLog.js';

/**
 * await auditLog.write({ actorId, action: 'kurasi.disetujui', entity: 'KurasiSubmission',
 *                        entityId, meta: { grade: 'A' }, ip: req.ip });
 * Kegagalan audit tidak boleh menggagalkan request utama.
 */
export async function write({ actorId = null, action, entity, entityId, meta, ip }) {
  try {
    await AuditLog.create({
      actorId,
      action,
      entity,
      entityId: entityId != null ? String(entityId) : undefined,
      meta,
      ip,
    });
  } catch (err) {
    console.error('[auditLog] gagal menulis:', err.message);
  }
}

export const auditLog = { write };
export default auditLog;
