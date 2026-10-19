import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

for (const key of ['MONGODB_URI', 'JWT_SECRET']) {
  if (!process.env[key]) {
    console.error(`Missing environment variable ${key}. Copy .env.example to .env and fill it in.`);
    process.exit(1);
  }
}

const port = process.env.PORT || 5000;

await connectDB(process.env.MONGODB_URI);
app.listen(port, () => console.log(`API listening on port ${port}`));
