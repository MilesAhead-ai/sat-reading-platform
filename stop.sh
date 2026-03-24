#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

# Support both docker compose V2 and docker-compose V1
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  DC="docker-compose"
fi

PIDFILE=".service.pids"

echo "==> Stopping application processes..."

if [ -f "$PIDFILE" ]; then
  read -r API_PID WEB_PID < "$PIDFILE"

  for PID in $API_PID $WEB_PID; do
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" 2>/dev/null && echo "    Killed PID $PID" || true
    else
      echo "    PID $PID already stopped"
    fi
  done

  rm -f "$PIDFILE"
else
  echo "    No PID file found, cleaning up by port..."
fi

# Clean up any remaining processes on ports 3000 and 3001
for PORT in 3000 3001; do
  PIDS=$(lsof -ti:"$PORT" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "    Killing remaining processes on port $PORT: $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  fi
done

# Kill any orphaned child processes by name pattern
for PATTERN in 'nest start --watch' 'next dev.*--port 3001' 'pnpm.*filter.*(api|web).*dev' 'pnpm dev'; do
  PIDS=$(pgrep -f "$PATTERN" 2>/dev/null || true)
  if [ -n "$PIDS" ]; then
    echo "    Killing orphaned processes matching '$PATTERN': $PIDS"
    echo "$PIDS" | xargs kill -9 2>/dev/null || true
  fi
done

echo "==> Stopping Docker containers..."
$DC down

echo ""
echo "All services stopped."
