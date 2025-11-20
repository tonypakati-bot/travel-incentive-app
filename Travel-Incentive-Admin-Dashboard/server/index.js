import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import invitesRouter from './routes/invites.js';
import sendInvitesRouter from './routes/sendInvites.js';
import participantsRouter from './routes/participants.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/invites', invitesRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/invites', sendInvitesRouter);

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-admin';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch(err => console.error('Mongo connection error', err));
