#!/usr/bin/env bash
# ------------------------------------------------------------------
# C# Engineer Learning Tracker - local launcher
#
#   macOS : double-click this file in Finder
#   Any OS: ./start.command      (or: bash start.command)
#
# It serves this folder over http://127.0.0.1:<port> using whatever is
# already on your machine (Python or Node). The app itself needs neither -
# you can also just open index.html directly - but a local server keeps
# browser storage reliable and is the recommended way to run it.
# ------------------------------------------------------------------
set -u
cd "$(dirname "$0")" || exit 1

START_PORT=5173
PORT=$START_PORT

# Find a free port so a second copy of the app does not clash.
port_free() {
  ! (command -v nc >/dev/null 2>&1 && nc -z 127.0.0.1 "$1" >/dev/null 2>&1)
}
while ! port_free "$PORT"; do
  PORT=$((PORT + 1))
  if [ "$PORT" -gt $((START_PORT + 20)) ]; then
    echo "Could not find a free port between $START_PORT and $PORT."
    exit 1
  fi
done

URL="http://127.0.0.1:$PORT"

open_browser() {
  sleep 1
  if command -v open        >/dev/null 2>&1; then open "$URL"
  elif command -v xdg-open  >/dev/null 2>&1; then xdg-open "$URL"
  else echo "Open this in your browser: $URL"
  fi
}

echo ""
echo "  C# Engineer Learning Tracker"
echo "  ---------------------------"
echo "  Serving on $URL"
echo "  Press Ctrl+C to stop."
echo ""

open_browser &

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v python >/dev/null 2>&1; then
  exec python -m SimpleHTTPServer "$PORT"
elif command -v npx >/dev/null 2>&1; then
  exec npx --yes serve . -l "$PORT"
else
  echo "No python3, python or npx found."
  echo "You can still use the app: open index.html in your browser."
  exit 1
fi
