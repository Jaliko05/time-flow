# Time Flow - Setup Script
# Este script automatiza la instalación del proyecto

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Time Flow - Setup Automático" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Verificar requisitos
Write-Host "Verificando requisitos..." -ForegroundColor Yellow

# Verificar Go
try {
    $goVersion = go version
    Write-Host "✓ Go instalado: $goVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Go no está instalado. Por favor instala Go 1.21 o superior." -ForegroundColor Red
    exit 1
}

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js instalado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js no está instalado. Por favor instala Node.js 18 o superior." -ForegroundColor Red
    exit 1
}

# Verificar PostgreSQL
try {
    $pgService = Get-Service postgresql* -ErrorAction SilentlyContinue
    if ($pgService) {
        Write-Host "✓ PostgreSQL encontrado" -ForegroundColor Green
    } else {
        Write-Host "⚠ PostgreSQL no encontrado. Asegúrate de tenerlo instalado." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ No se pudo verificar PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Configurando Backend (Go)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Set-Location backend

# Copiar .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host "Copiando archivo .env.example a .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Archivo .env creado. Por favor, edita las credenciales de PostgreSQL." -ForegroundColor Green
    Write-Host ""
    Write-Host "Presiona Enter para continuar después de editar .env..." -ForegroundColor Yellow
    Read-Host
} else {
    Write-Host "✓ Archivo .env ya existe" -ForegroundColor Green
}

# Instalar dependencias Go
Write-Host "Instalando dependencias Go..." -ForegroundColor Yellow
go mod download
go mod tidy
Write-Host "✓ Dependencias Go instaladas" -ForegroundColor Green

# Instalar swag
Write-Host "Instalando herramienta Swagger..." -ForegroundColor Yellow
go install github.com/swaggo/swag/cmd/swag@latest
Write-Host "✓ Swagger instalado" -ForegroundColor Green

# Generar documentación Swagger
Write-Host "Generando documentación Swagger..." -ForegroundColor Yellow
& "$env:USERPROFILE\go\bin\swag.exe" init -g main.go -o ./docs
Write-Host "✓ Documentación Swagger generada" -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   Configurando Frontend (React)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Set-Location ..\frontend

# Copiar .env si no existe
if (-not (Test-Path ".env")) {
    Write-Host "Copiando archivo .env.example a .env..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Archivo .env creado" -ForegroundColor Green
} else {
    Write-Host "✓ Archivo .env ya existe" -ForegroundColor Green
}

# Instalar dependencias npm
Write-Host "Instalando dependencias npm..." -ForegroundColor Yellow
npm install
Write-Host "✓ Dependencias npm instaladas" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "=====================================" -ForegroundColor Green
Write-Host "   ¡Setup Completado!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "1. Asegúrate de que PostgreSQL esté corriendo" -ForegroundColor White
Write-Host "2. Crea la base de datos: psql -U postgres -c 'CREATE DATABASE timeflow;'" -ForegroundColor White
Write-Host "3. Ejecuta el backend: cd backend && go run main.go" -ForegroundColor White
Write-Host "4. En otra terminal, ejecuta el frontend: cd frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "URLs:" -ForegroundColor Cyan
Write-Host "  - Backend API: http://localhost:8080" -ForegroundColor White
Write-Host "  - Swagger UI: http://localhost:8080/swagger/index.html" -ForegroundColor White
Write-Host "  - Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Usuario por defecto:" -ForegroundColor Cyan
Write-Host "  - Email: admin@timeflow.com" -ForegroundColor White
Write-Host "  - Password: admin123" -ForegroundColor White
Write-Host ""
