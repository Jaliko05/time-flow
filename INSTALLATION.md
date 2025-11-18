# Time Flow - Guía de Instalación y Ejecución

## 📋 Requisitos Previos

### Backend

- Go 1.21 o superior
- PostgreSQL 13 o superior
- Make (opcional)

### Frontend

- Node.js 18 o superior
- npm o yarn

## 🚀 Instalación

### 1. Base de Datos PostgreSQL

Primero, crea la base de datos:

```sql
CREATE DATABASE timeflow;
```

O usando psql:

```bash
psql -U postgres -c "CREATE DATABASE timeflow;"
```

### 2. Backend (Go)

```bash
# Ir a la carpeta backend
cd backend

# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL
# Especialmente: DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET

# Instalar dependencias Go
go mod download

# Instalar herramienta Swagger
go install github.com/swaggo/swag/cmd/swag@latest

# Generar documentación Swagger
swag init -g main.go -o ./docs

# Ejecutar el backend
go run main.go
```

El backend estará disponible en: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger/index.html`

**Usuario por defecto:**

- Email: `admin@timeflow.com`
- Password: `admin123`
- Rol: `superadmin`

### 3. Frontend (React + Vite)

```bash
# Ir a la carpeta frontend
cd frontend

# Instalar dependencias
npm install

# Copiar archivo de configuración
cp .env.example .env

# Ejecutar el frontend
npm run dev
```

El frontend estará disponible en: `http://localhost:5173`

## 🔧 Comandos Útiles

### Backend

```bash
# Con Make
make dev          # Genera docs y ejecuta
make swagger      # Solo genera documentación Swagger
make run          # Solo ejecuta
make build        # Compila el binario

# Sin Make
swag init -g main.go -o ./docs
go run main.go
```

### Frontend

```bash
npm run dev       # Modo desarrollo
npm run build     # Compilar para producción
npm run preview   # Vista previa de producción
```

## 📝 Configuración

### Backend (.env)

```env
PORT=8080
GIN_MODE=debug

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=timeflow
DB_SSLMODE=disable

JWT_SECRET=tu-secreto-jwt-super-seguro
JWT_EXPIRATION_HOURS=24

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8080/api/v1
```

## 🗄️ Estructura de Roles

### SuperAdmin

- Acceso total a todas las áreas
- Gestión de usuarios, áreas, proyectos y actividades
- Único rol que puede eliminar usuarios y áreas

### Admin

- Acceso limitado a su área asignada
- Gestión de usuarios de su área
- Puede crear usuarios con rol "user"
- Visualización de actividades de su área

### User

- Acceso solo a sus propios datos
- Gestión de sus proyectos
- Registro de actividades

## 🔐 Autenticación

La aplicación usa JWT (JSON Web Tokens). El flujo es:

1. Login en `/api/v1/auth/login`
2. Recibe token JWT
3. Incluye el token en header: `Authorization: Bearer <token>`

El frontend maneja esto automáticamente.

## 📊 Características Principales

### Backend

- API REST con Gin Framework
- ORM con GORM
- Autenticación JWT
- Migraciones automáticas de BD
- Documentación Swagger interactiva
- Control de acceso por roles y áreas

### Frontend

- React 18 con Vite
- React Router para navegación
- React Query para gestión de estado
- Shadcn/ui para componentes
- Tailwind CSS para estilos
- Axios para peticiones HTTP

## 🐛 Solución de Problemas

### Backend no conecta a PostgreSQL

1. Verifica que PostgreSQL esté corriendo:

```bash
# Windows
Get-Service postgresql*

# Linux/Mac
sudo systemctl status postgresql
```

2. Verifica las credenciales en `.env`
3. Verifica que la base de datos existe:

```bash
psql -U postgres -l | grep timeflow
```

### Error "swag command not found"

```bash
go install github.com/swaggo/swag/cmd/swag@latest

# Asegúrate de que $GOPATH/bin esté en tu PATH
# Windows (PowerShell):
$env:Path += ";$env:USERPROFILE\go\bin"

# Linux/Mac:
export PATH=$PATH:$(go env GOPATH)/bin
```

### Frontend no conecta con Backend

1. Verifica que el backend esté corriendo en `http://localhost:8080`
2. Verifica el archivo `.env` del frontend
3. Revisa la consola del navegador para errores CORS

### Error de CORS

Asegúrate de que en el `.env` del backend, `CORS_ORIGINS` incluye la URL del frontend:

```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 🧪 Pruebas

### Probar Backend con Swagger

1. Abre `http://localhost:8080/swagger/index.html`
2. Haz login en el endpoint `/auth/login`
3. Copia el token de la respuesta
4. Click en "Authorize" (arriba derecha)
5. Ingresa: `Bearer <tu-token>`
6. Prueba los demás endpoints

### Probar Backend con curl

```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@timeflow.com","password":"admin123"}'

# Usar el token recibido
TOKEN="tu-token-aqui"

# Obtener usuario actual
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# Listar actividades
curl http://localhost:8080/api/v1/activities \
  -H "Authorization: Bearer $TOKEN"
```

## 📚 Documentación API

Toda la documentación de la API está disponible en Swagger:
`http://localhost:8080/swagger/index.html`

Incluye:

- Descripción de cada endpoint
- Parámetros requeridos y opcionales
- Ejemplos de request/response
- Códigos de estado HTTP
- Modelos de datos

## 🤝 Contribuir

1. Asegúrate de que el código compila sin errores
2. Ejecuta las pruebas (cuando estén disponibles)
3. Genera la documentación Swagger actualizada
4. Crea un Pull Request con descripción clara

## 📞 Soporte

Para problemas o preguntas:

1. Revisa esta documentación
2. Consulta Swagger para detalles de la API
3. Revisa los logs del backend y frontend
4. Crea un issue en el repositorio
