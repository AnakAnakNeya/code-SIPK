import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

await connectDB();
createApp().listen(env.PORT, () => {
  console.log(`SIPK-Lebak API berjalan di http://localhost:${env.PORT}/api/v1 (${env.NODE_ENV})`);
});
