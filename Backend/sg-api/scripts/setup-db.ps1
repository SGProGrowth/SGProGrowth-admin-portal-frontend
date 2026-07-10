# SG Pro Growth — Database setup

Write-Host "SG Pro Growth — PostgreSQL setup" -ForegroundColor Cyan
Write-Host ""

$envFile = Join-Path $PSScriptRoot ".." ".env"
if (-not (Test-Path $envFile)) {
  Copy-Item (Join-Path $PSScriptRoot ".." ".env.example") $envFile
  Write-Host "Created .env from .env.example — edit DATABASE_URL if needed." -ForegroundColor Yellow
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if ($docker) {
  Write-Host "Starting PostgreSQL with Docker..." -ForegroundColor Green
  Push-Location (Join-Path $PSScriptRoot "..")
  docker compose up -d
  Pop-Location
  Start-Sleep -Seconds 5
} else {
  Write-Host "Docker not found. Using your local PostgreSQL at DATABASE_URL in .env" -ForegroundColor Yellow
  Write-Host "Install Docker Desktop OR PostgreSQL and set DATABASE_URL accordingly."
  Write-Host ""
}

Push-Location (Join-Path $PSScriptRoot "..")
Write-Host "Applying schema..." -ForegroundColor Green
npx prisma db push
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Failed to connect. Update DATABASE_URL in Backend/sg-api/.env" -ForegroundColor Red
  Write-Host "Example: postgresql://USER:PASSWORD@localhost:5432/sgpro"
  Pop-Location
  exit 1
}

Write-Host "Seeding data..." -ForegroundColor Green
npm run db:seed
Pop-Location

Write-Host ""
Write-Host "Done. Start the API with: npm run dev" -ForegroundColor Green
