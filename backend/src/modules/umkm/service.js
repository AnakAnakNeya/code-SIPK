import BusinessProfile from '../../models/BusinessProfile.js';
import { AppError } from '../../utils/AppError.js';
import auditLog from '../../utils/auditLog.js';

export async function getProfile(businessId) {
  const profile = await BusinessProfile.findById(businessId);
  if (!profile) throw AppError.notFound('Profil usaha tidak ditemukan.');
  return profile;
}

/** Ubah profil usaha. NIB tidak termasuk (hanya dinas yang boleh, AC-01-16). */
export async function updateProfile(businessId, userId, changes, ip) {
  const profile = await getProfile(businessId);
  Object.assign(profile, changes);
  await profile.save();
  await auditLog.write({
    actorId: userId,
    action: 'profil.diubah',
    entity: 'BusinessProfile',
    entityId: profile._id,
    meta: { fields: Object.keys(changes) },
    ip,
  });
  return profile;
}
