#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

pkill npm
pkill node

# Start the backend server
cd "$SCRIPT_DIR/src/backend"
npm start &

# Start the frontend server
cd "$SCRIPT_DIR/src/frontend"
npm install
npm run dev &

# Trap Ctrl+C to kill node processes
trap "pkill node" INT

# Wait for background processes
wait