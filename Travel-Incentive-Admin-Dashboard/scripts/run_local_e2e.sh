#!/usr/bin/env bash
set -eo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "Starting server (background), logging to /tmp/server_dev.log"
# kill any existing listener on 5001
pids=$(lsof -ti tcp:5001 || true)
if [ -n "$pids" ]; then
  echo "Killing existing process on 5001: $pids"
  kill -9 $pids || true
fi

# start server
cd server
nohup node index.js > /tmp/server_dev.log 2>&1 &
SERVER_PID=$!
sleep 1

echo "Server started (pid=$SERVER_PID)."
cd "$ROOT_DIR"

# run E2E script
E2E_SCRIPT="$ROOT_DIR/tmp_e2e.create_trip_full.cjs"
if [ ! -f "$E2E_SCRIPT" ]; then
  echo "E2E script not found: $E2E_SCRIPT"
  exit 1
fi

echo "Running E2E script against http://localhost:3000"
node "$E2E_SCRIPT" http://localhost:3000 || true

echo "--- tailing server log (last 300 lines) ---"
tail -n 300 /tmp/server_dev.log || true

echo "E2E finished. Server left running (pid=$SERVER_PID). Kill it with: kill $SERVER_PID" 
