import { ROLES } from './enums.js';

export { ROLES };

// kabid mewarisi seluruh wewenang staf (PRD Sprint 1, Seksi 2).
export const ROLE_INHERITANCE = {
  [ROLES.KABID]: [ROLES.STAF],
};

export const HOME_BY_ROLE = {
  [ROLES.UMKM]: '/umkm/dasbor',
  [ROLES.STAF]: '/dinas/dasbor',
  [ROLES.KABID]: '/dinas/dasbor',
  [ROLES.MITRA]: '/mitra/katalog',
};
