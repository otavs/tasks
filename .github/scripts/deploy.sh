#!/bin/bash

set -euxo pipefail

echo "Checking if destination folder exists"
if [ ! -d "$DEST_FOLDER" ]; then
  echo "Destination folder not found. Creating and cloning repository..."
  mkdir -p "$DEST_FOLDER"
  git clone https://github.com/$REPO "$DEST_FOLDER"
fi

echo "Updating repository"
cd "$DEST_FOLDER"
git fetch
git checkout -f main
git reset --hard origin/main

echo "Setting up Node.js 23"
set +x
source ~/.nvm/nvm.sh
set -x
if ! nvm ls 23 > /dev/null 2>&1; then
  echo "Node.js 23 not found. Installing..."
  nvm install 23
fi
echo "Using Node.js 23"
nvm use 23

echo "Creating .env file"
echo "ENV=$ENV" > back/.env
echo "PORT=$PORT" >> back/.env

echo "Building frontend"
cd front
npm install
npm run build
cd ..

echo "Installing backend dependencies"
cd back
npm install

echo "Running migrations"
npm run migrate:deploy

echo "Restarting backend with PM2"
pm2 restart tasks || pm2 start npm --name tasks -- start