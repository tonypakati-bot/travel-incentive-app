import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = 'mongodb://localhost:27017/travel-incentive'; // Always use travel-incentive database

console.log('Database configuration:', {
  nodeEnv: process.env.NODE_ENV,
  uri: MONGODB_URI
});

const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...', {
      nodeEnv: process.env.NODE_ENV,
      uri: MONGODB_URI,
      mongoose: mongoose.version
    });

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,  // Force IPv4
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000
    });
    
    mongoose.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Test database access and get info
    const admin = mongoose.connection.db.admin();
    await admin.ping();
    const dbStats = await mongoose.connection.db.stats();
    console.log('Database info:', {
      name: mongoose.connection.name,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      collections: dbStats.collections,
      documents: dbStats.objects
    });

    return mongoose.connection.db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

export { connectDB, MONGODB_URI };