#!/bin/bash

echo "Starting PostgreSQL with Docker Compose..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo "   Then run this script again: ./start-db.sh"
    exit 1
fi

# Start the services
docker compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
sleep 3

# Check if container is running
if docker ps | grep -q erp_2025_postgres; then
    echo "✅ PostgreSQL is running!"
    echo ""
    echo "Database connection details:"
    echo "  Host: localhost"
    echo "  Port: 5432"
    echo "  Database: erp_2025"
    echo "  Username: postgres"
    echo "  Password: postgres"
    echo ""
    echo "To seed the database, run:"
    echo "  cd db && node run-seed.js"
else
    echo "❌ Failed to start PostgreSQL container"
    docker compose logs postgres
    exit 1
fi











