#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Support both $DC V2 and docker-compose V1
if $DC version >/dev/null 2>&1; then
  DC="$DC"
else
  DC="docker-compose"
fi

PIDFILE=".service.pids"

if [ -f "$PIDFILE" ]; then
  echo "Services may already be running (found $PIDFILE). Run ./stop.sh first."
  exit 1
fi

echo "==> Starting Docker containers (PostgreSQL, Redis)..."
$DC up -d postgres redis
echo "    Waiting for PostgreSQL to be healthy..."
until $DC exec -T postgres pg_isready -U sat_user -d sat_reading >/dev/null 2>&1; do
  sleep 1
done
echo "    PostgreSQL is ready."

echo "==> Starting NestJS API (port 3000)..."
pnpm --filter api dev > /tmp/sat-api.log 2>&1 &
API_PID=$!
echo "    API PID: $API_PID (logs: /tmp/sat-api.log)"
echo "    Waiting for API to be ready..."
until curl -sf http://localhost:3000/api/docs >/dev/null 2>&1; do
  sleep 1
done
echo "    API is ready."

echo "==> Starting Next.js frontend (port 3001)..."
pnpm --filter web dev > /tmp/sat-web.log 2>&1 &
WEB_PID=$!
echo "    Web PID: $WEB_PID (logs: /tmp/sat-web.log)"

# Save PIDs for stop script
echo "$API_PID $WEB_PID" > "$PIDFILE"

echo ""
echo "All services started:"
echo "  API:      http://localhost:3000"
echo "  API Docs: http://localhost:3000/api/docs"
echo "  Frontend: http://localhost:3001"
echo ""
echo "Logs:"
echo "  tail -f /tmp/sat-api.log"
echo "  tail -f /tmp/sat-web.log"
echo ""
echo "Run ./stop.sh to stop all services."
