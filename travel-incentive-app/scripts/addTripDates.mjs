import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'travel-incentive';

(async () => {
  const client = new MongoClient(uri, { connectTimeoutMS: 10000 });
  try {
    console.log('Connecting to', uri, 'DB:', dbName);
    await client.connect();
    const db = client.db(dbName);
    const trips = db.collection('trips');

    const tripId = new ObjectId('690fa390123a9fd7be87cdb8'); // Specific trip ID from user

    const update = {
      $set: {
        'eventDetails.startDate': '2025-11-06',
        'eventDetails.endDate': '2025-11-10'
      }
    };

    const res = await trips.updateOne({ _id: tripId }, update);
    console.log(`Migration complete. Documents updated: ${res.modifiedCount}`);
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    await client.close();
    process.exit(1);
  }
})();
