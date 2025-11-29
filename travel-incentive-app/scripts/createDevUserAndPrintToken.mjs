import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../server/models/User.mjs';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'travel-incentive';
const USER_EMAIL = 'devtest@example.com';
const USER_PASSWORD = 'password123';

async function run() {
  await mongoose.connect(`${MONGO_URL}/${DB_NAME}`);
  let user = await User.findOne({ email: USER_EMAIL }).select('+password');
  if (!user) {
    const hashed = await bcrypt.hash(USER_PASSWORD, 10);
    user = new User({ firstName: 'Dev', lastName: 'Test', email: USER_EMAIL, password: hashed, role: 'admin', authorizationCode: 'dev' });
    await user.save();
    console.log('Created user', USER_EMAIL);
  } else {
    console.log('User exists');
  }
  const payload = { user: { id: user.id } };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: 3600 });
  console.log('TOKEN:' + token);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
