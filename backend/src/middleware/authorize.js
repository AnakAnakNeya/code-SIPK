import { ROLE_INHERITANCE } from '../constants/roles.js';
import { AppError } from '../utils/AppError.js';

/**
 * authorize('staf')            // staf dan kabid lolos (kabid mewarisi staf)
 * authorize('kabid')           // hanya kabid
 * authorize('umkm', 'mitra')   // salah satu dari role tersebut
 */
export function authorize(...allowed) {
  return (req, res, next) => {
    if (!req.user) return next(AppError.unauthenticated());
    const effective = [req.user.role, ...(ROLE_INHERITANCE[req.user.role] ?? [])];
    if (allowed.some((role) => effective.includes(role))) return next();
    return next(AppError.forbidden());
  };
}
