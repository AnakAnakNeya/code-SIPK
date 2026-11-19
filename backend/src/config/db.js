import mongoose from 'mongoose';
import { env } from './env.js';

let mongodInstance = null;

export async function connectDB(uri = env.MONGODB_URI) {
  mongoose.set('strictQuery', true);
  try {
    // Coba koneksi ke MongoDB (dengan timeout 2.5 detik)
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    console.log(`[SIPK] Terhubung ke MongoDB: ${uri}`);
    return mongoose.connection;
  } catch (err) {
    if (env.isDevelopment) {
      console.warn(`[INFO] MongoDB lokal (${uri}) tidak terdeteksi.`);
      console.log(`[INFO] Mengaktifkan embedded MongoMemoryServer untuk pengujian lokal...`);
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memUri = mongodInstance.getUri();
      await mongoose.connect(memUri);
      console.log(`[OK] Embedded MongoMemoryServer aktif di ${memUri}`);

      // Jalankan seeding otomatis
      try {
        const { runSeeders } = await import('../seeders/index.js');
        await runSeeders();
      } catch (seedErr) {
        console.warn(`[WARN] Gagal auto-seeding:`, seedErr.message);
      }
      return mongoose.connection;
    }
    throw err;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (mongodInstance) {
    await mongodInstance.stop();
  }
}
