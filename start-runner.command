#!/usr/bin/env bash
# ------------------------------------------------------------------
# C# Engineer Learning Tracker - optional local code runner
#
#   macOS : double-click this file in Finder
#   Any OS: ./start-runner.command
#
# Starts the local execution service so the code editor in each lesson
# can really compile and run your C# with the .NET SDK on this machine.
#
# The tracker works fine WITHOUT this - the editor then falls back to
# static "code checked" validation and clearly says so.
#
# Leave this window open while you learn. Ctrl+C stops it.
# ------------------------------------------------------------------
set -u
cd "$(dirname "$0")" || exit 1

if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "  Node.js is required to run the code runner but was not found."
  echo "  The tracker still works - lessons will use static checks instead."
  echo ""
  read -r -p "  Press Enter to close." _
  exit 1
fi

if ! command -v dotnet >/dev/null 2>&1; then
  echo ""
  echo "  No .NET SDK found (\`dotnet\` is not on your PATH)."
  echo "  Install it from https://dotnet.microsoft.com/download to compile and run C#."
  echo "  The tracker still works - lessons will use static checks instead."
  echo ""
  read -r -p "  Press Enter to close." _
  exit 1
fi

exec node tools/csharp-runner.js
