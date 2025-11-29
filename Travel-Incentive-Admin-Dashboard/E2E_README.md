Quick E2E README

This document explains how to run the full local E2E flow for the Admin Dashboard.

Prerequisites
- Node.js (v16+ recommended) and npm
- MongoDB running and reachable by the server configuration (default: localhost)
- Frontend dev server running at `http://localhost:3000` (Vite)

What the helper does
- Starts the server (background) and logs to `/tmp/server_dev.log`
- Runs the headless E2E script `tmp_e2e.create_trip_full.cjs` against `http://localhost:3000`
- Tails the server log and prints the E2E output

How to run

Run the helper script from the `Travel-Incentive-Admin-Dashboard` folder:

```bash
./scripts/run_local_e2e.sh
```

If you prefer to run steps manually:

1. From the `server` folder start the server:

```bash
cd server
nohup node index.js > /tmp/server_dev.log 2>&1 &
```

2. Start the frontend dev server (project root `Travel-Incentive-Admin-Dashboard`):

```bash
npm run dev
# or in another terminal
pnpm dev
```

3. Run the E2E script (from project root):

```bash
node tmp_e2e.create_trip_full.cjs http://localhost:3000
```

Logs
- Server log: `/tmp/server_dev.log`
- If you need to inspect the last PATCH payload captured by instrumentation: `/tmp/last_patch_payload.json`

Notes
- The helper is meant for local development. CI should run the E2E in an isolated environment with proper setup for MongoDB and headless browsers.
