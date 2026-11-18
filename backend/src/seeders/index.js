import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { seedBusinesses } from './businessSeeder.js';
import { seedUsers } from './userSeeder.js';

// Pemilik modul lain menambahkan seeder-nya di sini (dokumen, produk) setelah users & business.
async function run() {
  if (env.isProduction) throw new Error('Seeder tidak boleh dijalankan di production.');
  await connectDB();
  console.log('Menjalankan seeder...');
  const usersByEmail = await seedUsers();
  await seedBusinesses(usersByEmail);
  console.log('Selesai. Kata sandi seed: Password123!');
  await disconnectDB();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
