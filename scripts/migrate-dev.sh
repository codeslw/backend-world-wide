#!/bin/bash
# Script to run prisma migrations in development

echo "Running Prisma migrations in development environment..."
npx prisma migrate dev "$@"

if [ $? -eq 0 ]; then
  echo "Migration completed successfully!"
else
  echo "Migration failed. Trying to troubleshoot..."
  
  # Check if database is running
  if ! docker ps | grep -q "postgres-dev"; then
    echo "Database container not found. Starting a new one..."
    docker run --name postgres-dev -e POSTGRES_USER=saidkamol -e POSTGRES_PASSWORD=password -e POSTGRES_DB=world-wide-db -p 5432:5432 -d postgres:15-alpine
    
    echo "Waiting for database to initialize..."
    sleep 5
    
    echo "Retrying migration..."
    npx prisma migrate dev "$@"
  else
    echo "Database container is running. Please check your connection settings."
    echo "Current DATABASE_URL in .env: $(grep DATABASE_URL .env)"
  fi
fi 