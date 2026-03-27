const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

dotenv.config({ path: require('path').join(__dirname, '..', '..', '.env') });

async function ensureDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = await Admin.findOne({ username });
  if (existingAdmin) {
    return existingAdmin;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return Admin.create({ username, passwordHash });
}

async function run() {
  try {
    await connectDB();
    const admin = await ensureDefaultAdmin();
    console.log(`Admin ready: ${admin.username}`);
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed admin:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  run();
}

module.exports = { ensureDefaultAdmin };
