#!/bin/bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

# Resolve npm: prefer system npm, fall back to common paths
NPM="npm"
if ! command -v npm &>/dev/null; then
  for p in /opt/anaconda3/bin/npm /usr/local/bin/npm /opt/homebrew/bin/npm; do
    [ -x "$p" ] && NPM="$p" && break
  done
fi

echo "=== SCM Dashboard Setup ==="

# Backend setup
echo ""
echo ">> Setting up backend..."
cd "$ROOT/backend"

if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
pip install -q -r requirements.txt

if [ ! -f "scm.db" ]; then
  echo ">> Seeding database..."
  python seed.py
fi

echo ">> Starting backend on http://localhost:8000 ..."
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

# Frontend setup
echo ""
echo ">> Setting up frontend..."
cd "$ROOT/frontend"

if [ ! -d "node_modules" ]; then
  "$NPM" install --silent
fi

echo ">> Starting frontend on http://localhost:5173 ..."
"$NPM" run dev &
FRONTEND_PID=$!

echo ""
echo "=== System running ==="
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
