Migration scripts

migrate_documents_shape.mjs
- Converts legacy `documents` arrays (array of ObjectId strings) into the new shape:
  `documents: [{ documentId: ObjectId, category: String }]` using the canonical category order.

Run (from repository root):

```bash
cd server
node --experimental-modules ./scripts/migrate_documents_shape.mjs
```

Make sure `MONGO_URI` environment variable is set or edit the script to point to your DB.
Seed privacy policies

This script seeds the `privacy_policies` collection with initial documents.

Usage:

1. Ensure MongoDB is running and `server/.env` contains `MONGO_URI` if needed.
2. From project root run:

```bash
node server/scripts/seed_privacy_policies.mjs
```

The script will create or update the two initial documents (global + ibiza) by title.
