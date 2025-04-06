#!/bin/bash
set -e

echo "===== DEPLOYMENT FIXER SCRIPT ====="
echo "This script will fix common deployment issues"

# Fix git repository issues
echo "Fixing git repository..."
git config --global --add safe.directory $(pwd)

# Check if we're on the master branch
echo "Checking git branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "master" ]; then
    echo "Not on master branch. Switching to master..."
    git checkout master
fi

# Update to latest code
echo "Fetching latest code..."
git fetch --all
git reset --hard origin/master

# Fix permissions
echo "Fixing permissions..."
sudo chown -R $(whoami):$(whoami) .
chmod +x scripts/*.sh
chmod -R 777 ./prisma

# Clean Docker environment
echo "Cleaning Docker environment..."
docker-compose down
docker system prune -af --volumes

# Make sure the .env file exists
if [ ! -f .env ]; then
    echo "Creating .env file template..."
    cat > .env << EOF
# Update these values with your actual credentials
DATABASE_URL=postgresql://postgres:password@postgres:5432/world-wide-db?schema=public
JWT_SECRET=your_jwt_secret
DIGITAL_OCEAN_ACCESS_KEY=your_digital_ocean_access_key
DIGITAL_OCEAN_SECRET_KEY=your_digital_ocean_secret_key
DIGITAL_OCEAN_BUCKET=your_digital_ocean_bucket
DIGITAL_OCEAN_ENDPOINT=your_digital_ocean_endpoint
EOF
    echo ".env file created. Please update with your actual values before continuing."
    exit 1
fi

# Rebuild and restart
echo "Rebuilding and restarting containers..."
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to be ready..."
sleep 20

# Verify deployment
echo "Verifying deployment..."
docker-compose ps
curl -s http://localhost:3000/api/v1/health || echo "Health check failed, but containers may still be starting"

echo "===== FIX COMPLETE ====="
echo "If containers are still not running correctly, check the logs with:"
echo "docker-compose logs -f" 