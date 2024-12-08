#!/bin/bash

# Load NVM
export NVM_DIR="/home/ec2-user/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"

# Kill process running on port 4010 (if any)
PORT=4010
PID=$(lsof -t -i:$PORT)

if [ -n "$PID" ]; then
  echo "Killing process running on port $PORT (PID: $PID)"
  kill -9 $PID
else
  echo "No process running on port $PORT"
fi

# Start the server
npm run start-server