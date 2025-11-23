Seed privacy policies

This script seeds the `privacy_policies` collection with initial documents.

Usage:

1. Ensure MongoDB is running and `server/.env` contains `MONGO_URI` if needed.
2. From project root run:

```bash
node server/scripts/seed_privacy_policies.mjs
```

The script will create or update the two initial documents (global + ibiza) by title.
