import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import invitesRouter from './routes/invites.js';
import sendInvitesRouter from './routes/sendInvites.js';
import participantsRouter from './routes/participants.js';
import tripsRouter from './routes/trips.js';
import documentsRouter from './routes/documents.js';
import privacyPoliciesRouter from './routes/privacyPolicies.js';
import termsDocumentsRouter from './routes/termsDocuments.js';
import usefulInformationsRouter from './routes/usefulInformations.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/invites', invitesRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/invites', sendInvitesRouter);
app.use('/api/trips', tripsRouter);
// Legacy documents router: only mount in non-production environments to avoid
// accidentally writing to a dropped `documents` collection in production.
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/documents', documentsRouter);
} else {
  // In production, respond with 410 Gone for safety and to aid debugging if
  // external clients still attempt to call the legacy endpoint.
  app.use('/api/documents', (req, res) => res.status(410).json({ error: 'documents endpoint removed; use /api/useful-informations' }));
}
app.use('/api/privacy-policies', privacyPoliciesRouter);
app.use('/api/terms-documents', termsDocumentsRouter);
app.use('/api/useful-informations', usefulInformationsRouter);

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/travel-db';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
  })
  .catch(err => console.error('Mongo connection error', err));
