#!/bin/bash

# Converge KYC System - Setup Script (Linux/Mac)
# This script helps set up the environment

echo "🔐 Converge KYC System - Setup Script"
echo "===================================="
echo ""

# Check Docker
echo "Checking prerequisites..."
if command -v docker &> /dev/null; then
    echo "✓ Docker found: $(docker --version)"
else
    echo "✗ Docker not found! Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if command -v docker-compose &> /dev/null; then
    echo "✓ Docker Compose found: $(docker-compose --version)"
else
    echo "✗ Docker Compose not found!"
    exit 1
fi

echo ""

# Create .env file if it doesn't exist
if [[ ! -f ".env" ]]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo "✓ .env file created"
    echo "⚠️  Please review and update .env file with your settings"
else
    echo "✓ .env file already exists"
fi

echo ""

# Check if ports are available
echo "Checking if required ports are available..."

check_port() {
    local port="$1"
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "✗ Port $port is already in use"
        return 1
    else
        echo "✓ Port $port is available"
        return 0
    fi
}

PORTS_OK=true
check_port 3000 || PORTS_OK=false
check_port 5000 || PORTS_OK=false
check_port 5432 || PORTS_OK=false

if [[ "$PORTS_OK" = false ]]; then
    echo ""
    echo "⚠️  Some required ports are in use"
    echo "Please free these ports or update docker-compose.yml"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo ""

# Ask if user wants to start services
echo "Setup complete! Ready to start services."
read -p "Start Converge services now? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "Starting services with Docker Compose..."
    echo "This may take 2-3 minutes on first run..."
    echo ""
    
    docker-compose up --build
else
    echo ""
    echo "To start services later, run:"
    echo "  docker-compose up --build"
    echo ""
    echo "Once started, access:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:5000/api"
    echo "  Health:   http://localhost:5000/api/health"
    echo ""
    echo "Admin Credentials:"
    echo "  Email:    admin@converge.com"
    echo "  Password: Admin@123456"
    echo ""
fi
