import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const SEED_PASSWORD = 'Password123!'; // hanya untuk development

export const SEED_USERS = [
  { email: 'juli@diskop-lebak.go.id', role: 'kabid', nama: 'Ibu Juli Zakiah', status: 'aktif', noHp: '081200000001' },
  { email: 'staf1@diskop-lebak.go.id', role: 'staf', nama: 'Rina Marlina', status: 'aktif', noHp: '081200000002' },
  { email: 'staf2@diskop-lebak.go.id', role: 'staf', nama: 'Dedi Supriadi', status: 'aktif', noHp: '081200000003' },
  { email: 'ambu.kanekes@example.com', role: 'umkm', nama: 'Sarmi (Tenun Ambu Kanekes)', status: 'aktif', noHp: '081298441920' },
  { email: 'aren.jaya@example.com', role: 'umkm', nama: 'Hj. Entin (KUB Aren Jaya)', status: 'aktif', noHp: '081377112233' },
  { email: 'berkah.pangan@example.com', role: 'umkm', nama: 'Ujang (UMKM Berkah Pangan)', status: 'menunggu_persetujuan', noHp: '081355667788' },
  { email: 'procurement@hotelbanten.example', role: 'mitra', nama: 'Hotel & Konferensi Banten', status: 'aktif', noHp: '081211112222', mitraId: 'MTR-2026-0001' },
];

export async function seedUsers() {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  await User.deleteMany({ createdVia: 'seed' });
  const users = await User.insertMany(SEED_USERS.map((u) => ({ ...u, passwordHash, createdVia: 'seed' })));
  console.log(`  users: ${users.length} dibuat`);
  return Object.fromEntries(users.map((u) => [u.email, u]));
}
