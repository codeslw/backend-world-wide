#!/bin/bash
set -e

echo "=== MANUAL DEPLOYMENT SCRIPT ==="
echo "This script will ensure your git repo is updated and redeploy the application"

# Ensure proper ownership and permissions
sudo chown -R $(whoami):$(whoami) .
chmod +x scripts/*.sh

# Update git configuration for improved security
git config --global --add safe.directory $(pwd)

# Update repository with latest changes
echo "Updating repository..."
git fetch --all
git reset --hard origin/master

# Verify latest commit
echo "Latest commit:"
git log -1 --pretty=format:"%h - %an, %ar : %s"

# Create or update .env file if needed
if [ ! -f .env ]; then
    echo "Creating .env file..."
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
    echo "Edit the file with your values and then run this script again."
    exit 0
fi

# Verify JWT_SECRET is set
if [ -z "$(grep -E '^JWT_SECRET=' .env | cut -d '=' -f2)" ] || [ "$(grep -E '^JWT_SECRET=' .env | cut -d '=' -f2)" = "your_jwt_secret" ]; then
    echo "WARNING: JWT_SECRET is not set or is using the default value."
    echo "Please update your .env file with a proper JWT_SECRET value."
    echo "Example: JWT_SECRET=my_secure_random_string_here"
    exit 1
fi

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down

# Clean up Docker resources but preserve volumes
echo "Cleaning up Docker resources..."
docker system prune -af --filter "label!=keep"

# Build and start containers
echo "Building and starting containers..."
docker-compose build --no-cache
docker-compose up -d

# Wait for containers to be ready
echo "Waiting for containers to be ready..."
sleep 15

# Verify database connection and run migrations
echo "Verifying database connection..."
docker-compose exec -T postgres pg_isready -U postgres || (echo "Database not ready!" && exit 1)

echo "Running database migrations..."
docker-compose exec -T api npx prisma migrate deploy

# Verify containers are running
echo "Deployed containers:"
docker-compose ps

echo "=== DEPLOYMENT COMPLETED ==="
echo "You can check the API at: http://localhost:3000/api"
echo "You can check container logs with: docker-compose logs -f" 