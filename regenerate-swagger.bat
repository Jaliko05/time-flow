@echo off
echo Regenerando documentacion de Swagger...
echo.

cd backend

echo Ejecutando swag init...
swag init

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Documentacion de Swagger generada exitosamente
    echo.
    echo La documentacion estara disponible en:
    echo   http://localhost:8080/swagger/index.html
    echo.
) else (
    echo.
    echo × Error al generar la documentacion de Swagger
    echo.
    exit /b 1
)

cd ..
