#!/usr/bin/env bash
set -euo pipefail

# start-db-and-server.sh
# Convenience script to start a local MongoDB (via Docker if needed),
# seed the database (if seed script exists) and start the Admin server.
# Usage: ./scripts/start-db-and-server.sh [--no-docker] [--no-seed]

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_DIR="$ROOT_DIR/server"
MONGO_URL_DEFAULT="mongodb://localhost:27017/travel-db"
DOCKER_MONGO_NAME="travel-mongo"

NO_DOCKER=0
NO_SEED=0

for arg in "$@"; do
  case "$arg" in
    --no-docker) NO_DOCKER=1 ;;
    --no-seed) NO_SEED=1 ;;
    -h|--help)
      echo "Usage: $0 [--no-docker] [--no-seed]"
      exit 0
      ;;
    *) echo "Unknown arg: $arg" ;;
  esac
done

echo "Root: $ROOT_DIR"

# 1) Ensure MongoDB is running (check local mongod or start Docker container)
echo "Checking MongoDB availability at ${MONGO_URL_DEFAULT}..."

is_port_open() {
  # simple nc check
  nc -z localhost 27017 >/dev/null 2>&1
}

if is_port_open; then
  echo "MongoDB appears to be listening on localhost:27017"
else
  if [ "$NO_DOCKER" -eq 1 ]; then
    echo "MongoDB not reachable and --no-docker passed. Please start mongod locally or remove --no-docker." >&2
    exit 1
  fi

  # Try to start a Docker container
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker not installed or not in PATH; cannot start container. Start mongod manually." >&2
    exit 1
  fi

  if docker ps --format '{{.Names}}' | grep -q "^${DOCKER_MONGO_NAME}$"; then
    echo "Docker container ${DOCKER_MONGO_NAME} already running"
  else
    echo "Starting MongoDB docker container named ${DOCKER_MONGO_NAME}..."
    docker pull mongo:6 >/dev/null
    docker run -d --name ${DOCKER_MONGO_NAME} -p 27017:27017 -e MONGO_INITDB_DATABASE=travel-db mongo:6
    echo "Started ${DOCKER_MONGO_NAME}"
  fi

  echo "Waiting for MongoDB to accept connections..."
  for i in {1..30}; do
    if is_port_open; then
      echo "MongoDB is now accepting connections"
      break
    fi
    sleep 1
  done

  if ! is_port_open; then
    echo "MongoDB did not start in time." >&2
    exit 1
  fi
fi

# 2) Install server dependencies if needed
if [ -d "$SERVER_DIR" ]; then
  echo "Installing server dependencies (npm install) in $SERVER_DIR..."
  (cd "$SERVER_DIR" && npm install)
else
  echo "Server directory not found at $SERVER_DIR" >&2
  exit 1
fi

# 3) Seed the DB if seed script exists
if [ "$NO_SEED" -eq 0 ] && [ -f "$SERVER_DIR/seed.js" ]; then
  echo "Seeding database using server/seed.js"
  export MONGO_URL="${MONGO_URL_DEFAULT}"
  (cd "$SERVER_DIR" && node seed.js)
else
  if [ "$NO_SEED" -eq 1 ]; then
    echo "Skipping seed ( --no-seed )"
  else
    echo "No seed.js found in $SERVER_DIR; skipping seeding"
  fi
fi

# 4) Start the server (prefer index.js, server.js or app.js)
echo "Starting Admin server with MONGO_URL=${MONGO_URL_DEFAULT} on port 5001"
export MONGO_URL="${MONGO_URL_DEFAULT}"
export PORT=5001

START_CMD=""
if [ -f "$SERVER_DIR/index.js" ]; then
  START_CMD="node index.js"
elif [ -f "$SERVER_DIR/server.js" ]; then
  START_CMD="node server.js"
elif [ -f "$SERVER_DIR/app.js" ]; then
  START_CMD="node app.js"
else
  # fallback: try to run mock-backend if no real server entry found
  if [ -f "$SERVER_DIR/mock-backend.js" ]; then
    echo "No index/server/app entry found; starting mock-backend.js as fallback (note: mock is in-memory)"
    START_CMD="node mock-backend.js"
  else
    echo "No server entry point found in $SERVER_DIR (index.js/server.js/app.js/mock-backend.js)" >&2
    exit 1
  fi
fi

echo "Running: (cd $SERVER_DIR && $START_CMD)"
(cd "$SERVER_DIR" && eval $START_CMD)
