#!/bin/bash

# Script to run database seeding for development

echo "🌱 Starting database seeding process..."

# Check if database is available (assuming .env has DATABASE_URL set)
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL is not set. Please make sure your .env file is properly configured."
  exit 1
fi

# Generate Prisma client if needed
echo "📦 Generating Prisma client..."
npx prisma generate

# Run the seed script
echo "🌱 Seeding database..."
npm run prisma:seed

echo "✅ Database seeding completed successfully." 