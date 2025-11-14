import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import mongoose from 'mongoose';
import { connectDB } from './config/database.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Connect to database
await connectDB();

// Ensure JWT secret is configured
if (!process.env.JWT_SECRET) {
  console.error('\nERROR: JWT_SECRET environment variable is not set.\nPlease set JWT_SECRET in server/.env or your environment before starting the server.\n');
  process.exit(1);
}

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3003', 'http://localhost:3004'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Temporary forensic logging for PUT /api/trip to help debug missing fields
import fs from 'fs';

app.use((req, res, next) => {
  try {
    if (req.method === 'PUT' && req.path === '/api/trip') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        ip: req.ip || req.headers['x-forwarded-for'] || (req.connection && req.connection.remoteAddress),
        path: req.originalUrl,
        body: req.body
      };
      const out = JSON.stringify(logEntry) + '\n';
      fs.appendFileSync(resolve(__dirname, 'logs', 'put_trip.log'), out, { encoding: 'utf8' });
    }
  } catch (err) {
    console.error('Failed to write put_trip log', err);
  }
  next();
});

// Servire file statici dalla cartella uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Define Routes
import authRoutes from './routes/authRoutes.mjs';
import apiRoutes from './routes/api.mjs';

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => res.send('API Running'));

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

// Handle server shutdown
async function gracefulShutdown(signal) {
  console.log(`${signal} signal received. Closing HTTP server and database connection`);
  try {
    await server.close();
    await mongoose.connection.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error during shutdown:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  console.error('Unhandled Promise rejection:', err);
  await gracefulShutdown('UNHANDLED_REJECTION');
});
