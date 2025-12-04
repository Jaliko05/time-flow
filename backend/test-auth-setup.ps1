# Test Script for Microsoft Authentication
# Este script te ayuda a verificar que todo está configurado correctamente

Write-Host "=== TimeFlow - Test de Autenticación Microsoft ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar variables de entorno
Write-Host "1. Verificando archivo .env..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✓ Archivo .env encontrado" -ForegroundColor Green
    
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "MICROSOFT_CLIENT_ID=(.+)") {
        $clientId = $matches[1].Trim()
        if ($clientId -and $clientId -ne "your-microsoft-client-id-from-azure-portal") {
            Write-Host "   ✓ MICROSOFT_CLIENT_ID configurado: $clientId" -ForegroundColor Green
        } else {
            Write-Host "   ✗ MICROSOFT_CLIENT_ID no está configurado o usa valor de ejemplo" -ForegroundColor Red
            Write-Host "     Configura tu Client ID de Azure en .env" -ForegroundColor Red
        }
    } else {
        Write-Host "   ✗ MICROSOFT_CLIENT_ID no encontrado en .env" -ForegroundColor Red
    }
    
    if ($envContent -match "MICROSOFT_TENANT_ID=(.+)") {
        $tenantId = $matches[1].Trim()
        Write-Host "   ✓ MICROSOFT_TENANT_ID configurado: $tenantId" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ MICROSOFT_TENANT_ID no configurado (se usará 'common')" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ✗ Archivo .env no encontrado" -ForegroundColor Red
    Write-Host "     Ejecuta: cp .env.example .env" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# 2. Verificar que PostgreSQL esté corriendo
Write-Host "2. Verificando base de datos..." -ForegroundColor Yellow
try {
    $dbHost = if ($envContent -match "DB_HOST=(.+)") { $matches[1].Trim() } else { "localhost" }
    $dbPort = if ($envContent -match "DB_PORT=(.+)") { $matches[1].Trim() } else { "5432" }
    
    $connection = Test-NetConnection -ComputerName $dbHost -Port $dbPort -WarningAction SilentlyContinue
    if ($connection.TcpTestSucceeded) {
        Write-Host "   ✓ PostgreSQL está corriendo en ${dbHost}:${dbPort}" -ForegroundColor Green
    } else {
        Write-Host "   ✗ No se puede conectar a PostgreSQL en ${dbHost}:${dbPort}" -ForegroundColor Red
    }
} catch {
    Write-Host "   ⚠ No se pudo verificar PostgreSQL" -ForegroundColor Yellow
}

Write-Host ""

# 3. Verificar archivos creados
Write-Host "3. Verificando archivos de autenticación Microsoft..." -ForegroundColor Yellow

$requiredFiles = @(
    "utils\microsoft.go",
    "MICROSOFT_AUTH_GUIDE.md",
    "FRONTEND_EXAMPLE.md"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   ✓ $file" -ForegroundColor Green
    } else {
        Write-Host "   ✗ $file no encontrado" -ForegroundColor Red
    }
}

Write-Host ""

# 4. Compilar el proyecto
Write-Host "4. Compilando proyecto..." -ForegroundColor Yellow
$buildOutput = go build -o timeflow.exe main.go 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Compilación exitosa" -ForegroundColor Green
    Remove-Item "timeflow.exe" -ErrorAction SilentlyContinue
} else {
    Write-Host "   ✗ Error en compilación:" -ForegroundColor Red
    Write-Host $buildOutput -ForegroundColor Red
}

Write-Host ""

# 5. Verificar documentación Swagger
Write-Host "5. Verificando documentación Swagger..." -ForegroundColor Yellow
if (Test-Path "docs\swagger.json") {
    Write-Host "   ✓ Documentación Swagger generada" -ForegroundColor Green
} else {
    Write-Host "   ⚠ Documentación Swagger no encontrada" -ForegroundColor Yellow
    Write-Host "     Ejecuta: swag init -g main.go -o ./docs" -ForegroundColor Yellow
}

Write-Host ""

# 6. Instrucciones siguientes
Write-Host "=== Próximos Pasos ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Configurar Azure App Registration:" -ForegroundColor White
Write-Host "   - Ve a: https://portal.azure.com/#view/Microsoft_AAD_IAM/ActiveDirectoryMenuBlade/~/RegisteredApps" -ForegroundColor Gray
Write-Host "   - Crea nueva aplicación" -ForegroundColor Gray
Write-Host "   - Copia Client ID y actualiza .env" -ForegroundColor Gray
Write-Host ""

Write-Host "2. Ejecutar la aplicación:" -ForegroundColor White
Write-Host "   make dev" -ForegroundColor Cyan
Write-Host "   # o" -ForegroundColor Gray
Write-Host "   go run main.go" -ForegroundColor Cyan
Write-Host ""

Write-Host "3. Probar endpoints:" -ForegroundColor White
Write-Host "   Login Local:" -ForegroundColor Gray
Write-Host "   curl -X POST http://localhost:8080/api/v1/auth/login ``" -ForegroundColor Cyan
Write-Host "     -H 'Content-Type: application/json' ``" -ForegroundColor Cyan
Write-Host "     -d '{\"email\":\"admin@timeflow.com\",\"password\":\"admin123\"}'" -ForegroundColor Cyan
Write-Host ""

Write-Host "4. Documentación:" -ForegroundColor White
Write-Host "   - Backend: http://localhost:8080/swagger/index.html" -ForegroundColor Gray
Write-Host "   - Guía Microsoft: .\MICROSOFT_AUTH_GUIDE.md" -ForegroundColor Gray
Write-Host "   - Ejemplo Frontend: .\FRONTEND_EXAMPLE.md" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Estado Final ===" -ForegroundColor Cyan
if ($envContent -match "MICROSOFT_CLIENT_ID=(.+)" -and 
    $matches[1].Trim() -ne "your-microsoft-client-id-from-azure-portal") {
    Write-Host "✓ Backend configurado correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠ Falta configurar MICROSOFT_CLIENT_ID en .env" -ForegroundColor Yellow
}

Write-Host ""
