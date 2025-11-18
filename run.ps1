# Time Flow - Run Script
# Este script ejecuta el backend y frontend simultáneamente

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Iniciando Time Flow" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que los archivos .env existen
if (-not (Test-Path "backend\.env")) {
    Write-Host "✗ No se encontró backend\.env. Ejecuta setup.ps1 primero." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "frontend\.env")) {
    Write-Host "✗ No se encontró frontend\.env. Ejecuta setup.ps1 primero." -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando Backend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; go run main.go"

Start-Sleep -Seconds 2

Write-Host "Iniciando Frontend..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "   Time Flow Iniciado" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:8080" -ForegroundColor White
Write-Host "  - Swagger UI: http://localhost:8080/swagger/index.html" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Se abrieron dos ventanas de PowerShell para el backend y frontend." -ForegroundColor Yellow
Write-Host "Cierra esas ventanas para detener los servicios." -ForegroundColor Yellow
Write-Host ""
