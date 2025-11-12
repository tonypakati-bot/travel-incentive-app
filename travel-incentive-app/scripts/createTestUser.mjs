import mongoose from 'mongoose';
import { connectDB } from '../server/config/database.mjs';
import User from '../server/models/User.mjs';
import bcrypt from 'bcrypt';

const testUser = {
  email: 'mario.rossi@bevnet.it',
  firstName: 'Mario',
  lastName: 'Rossi',
  password: 'Test123!',  // Questa password verrà hashata
  groupName: 'Milano Malpensa',
  role: 'user',
  birthDate: '1980-01-01',
  nationality: 'Italiana',
  mobilePhone: '+39 333 1234567',
  passport: {
    number: 'YA1234567',
    issueDate: '2020-01-01',
    expiryDate: '2030-01-01'
  }
};

async function createTestUser() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Prima elimina l'utente se esiste
    await User.deleteOne({ email: testUser.email });
    console.log('Removed existing test user if any');

    // Hasha la password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(testUser.password, saltRounds);

    // Crea il nuovo utente
    const user = new User({
      ...testUser,
      password: passwordHash,  // Usa 'password' invece di 'passwordHash'
      preferences: new Map()
    });

    await user.save();
    console.log('Test user created successfully');
    console.log('\nCredenziali di accesso:');
    console.log('Email:', testUser.email);
    console.log('Password:', testUser.password);

  } catch (error) {
    console.error('Error creating test user:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('\nDatabase connection closed');
    }
    process.exit(0);
  }
}

createTestUser();