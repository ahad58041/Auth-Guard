// Run from authguard/: node scripts/seed.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const userSchema = new mongoose.Schema({
  firstName:     String,
  lastName:      String,
  email:         { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  username:      { type: String, required: true, unique: true, trim: true },
  password:      { type: String, required: true },
  loginAttempts: { type: Number, default: 0 },
  lockUntil:     Date,
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const testUsers = [
  { username: 'alice',    password: 'password123' },
  { username: 'bob',      password: '123456'      },
  { username: 'charlie',  password: 'qwerty'      },
  { username: 'diana',    password: 'letmein'     },
  { username: 'eve',      password: 'password'    },
  { username: 'frank',    password: 'abc123'      },
  { username: 'grace',    password: 'monkey'      },
  { username: 'henry',    password: 'dragon'      },
  { username: 'isabella', password: 'master'      },
  { username: 'jack',     password: 'sunshine'    },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await User.deleteMany({ email: { $exists: false } });
  console.log('Cleared seeded users');

  for (const u of testUsers) {
    const hashed = await bcrypt.hash(u.password, 10);
    await User.findOneAndUpdate(
      { username: u.username },
      { username: u.username, password: hashed },
      { upsert: true, new: true }
    );
    console.log(`  Seeded: ${u.username} / ${u.password}`);
  }

  console.log('\nDone — 10 test users ready');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
