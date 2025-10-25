#!/bin/bash
# Deployment script for Railway
# This runs database migrations before starting the server

echo "Starting deployment..."

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Push database schema (only if DATABASE_URL is set)
if [ -n "$DATABASE_URL" ]; then
  echo "Pushing database schema..."
  npx prisma db push --accept-data-loss || echo "Warning: Database push failed, continuing anyway..."
else
  echo "Warning: DATABASE_URL not set, skipping database push"
fi

echo "Deployment complete!"
