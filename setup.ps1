# Converge KYC System - Setup Script
# This script helps set up the environment

Write-Host "🔐 Converge KYC System - Setup Script" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Check Docker
Write-Host "Checking prerequisites..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker not found! Please install Docker Desktop first." -ForegroundColor Red
    Write-Host "Download from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

try {
    $composeVersion = docker-compose --version
    Write-Host "✓ Docker Compose found: $composeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose not found!" -ForegroundColor Red
    exit 1
}

Write-Host "`n"

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "⚠️  Please review and update .env file with your settings" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

Write-Host "`n"

# Check if ports are available
Write-Host "Checking if required ports are available..." -ForegroundColor Yellow

$portsToCheck = @(3000, 5000, 5432)
$portsInUse = @()

foreach ($port in $portsToCheck) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
        Write-Host "✗ Port $port is already in use" -ForegroundColor Red
    } else {
        Write-Host "✓ Port $port is available" -ForegroundColor Green
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "`n⚠️  Some required ports are in use: $($portsInUse -join ', ')" -ForegroundColor Yellow
    Write-Host "Please free these ports or update docker-compose.yml to use different ports" -ForegroundColor Yellow
    $continue = Read-Host "`nContinue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 0
    }
}

Write-Host "`n"

# Ask if user wants to start services
Write-Host "Setup complete! Ready to start services." -ForegroundColor Green
$start = Read-Host "Start Converge services now? (y/n)"

if ($start -eq 'y') {
    Write-Host "`nStarting services with Docker Compose..." -ForegroundColor Cyan
    Write-Host "This may take 2-3 minutes on first run...`n" -ForegroundColor Yellow
    
    docker-compose up --build
} else {
    Write-Host "`nTo start services later, run:" -ForegroundColor Yellow
    Write-Host "  docker-compose up --build`n" -ForegroundColor White
    
    Write-Host "Once started, access:" -ForegroundColor Yellow
    Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
    Write-Host "  Backend:  http://localhost:5000/api" -ForegroundColor White
    Write-Host "  Health:   http://localhost:5000/api/health`n" -ForegroundColor White
    
    Write-Host "Admin Credentials:" -ForegroundColor Yellow
    Write-Host "  Email:    admin@converge.com" -ForegroundColor White
    Write-Host "  Password: Admin@123456`n" -ForegroundColor White
}
