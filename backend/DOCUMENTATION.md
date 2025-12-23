# Backend Documentation - Time Flow

API REST para el sistema de gestión de tiempo Time Flow, construida con Go, Gin, GORM y PostgreSQL.

---

## 📋 Tabla de Contenidos

1. [Características](#características)
2. [Requisitos](#requisitos)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Arquitectura](#arquitectura)
5. [API Endpoints](#api-endpoints)
6. [Sistema de Autenticación](#sistema-de-autenticación)
7. [Sistema de Roles y Permisos](#sistema-de-roles-y-permisos)
8. [Base de Datos y Optimización](#base-de-datos-y-optimización)
9. [Sistema de Asignaciones](#sistema-de-asignaciones)
10. [Deployment](#deployment)
11. [Testing](#testing)
12. [Troubleshooting](#troubleshooting)

---

## 🚀 Características

- **Autenticación Dual**: Login local (email/password) y Microsoft OAuth 2.0
- **Integración con Microsoft Calendar**: Ver y convertir reuniones en actividades
- **JWT con roles**: SuperAdmin, Admin de Área, Usuario
- **Control de acceso por áreas**: Permisos granulares por departamento
- **CRUD completo**: Usuarios, Áreas, Proyectos, Tareas y Actividades
- **Asignaciones múltiples**: Proyectos y tareas con múltiples usuarios
- **Estadísticas avanzadas**: Filtros por usuario, área, fecha
- **Documentación Swagger**: Interactiva y auto-generada
- **Migraciones automáticas**: Índices y optimizaciones aplicadas al inicio
- **Logger de queries**: Detecta queries lentas (>200ms)

---

## 📋 Requisitos

- **Go** 1.21 o superior
- **PostgreSQL** 13 o superior
- **Make** (opcional, para comandos simplificados)
- **Swag CLI** (para generar documentación Swagger)

```bash
go install github.com/swaggo/swag/cmd/swag@latest
```

---

## 🔧 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd backend
go mod download
```

### 2. Variables de Entorno

Crear archivo `.env` en la carpeta `backend/`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=timeflow
DB_SSLMODE=disable

# Server
PORT=8080
GIN_MODE=debug

# JWT
JWT_SECRET=tu_secreto_super_seguro_minimo_32_caracteres
JWT_EXPIRATION_HOURS=24

# Microsoft OAuth (opcional)
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_TENANT_ID=tu_tenant_id
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback

# CORS
ALLOWED_ORIGINS=http://localhost:5173
```

### 3. Crear Base de Datos

```sql
CREATE DATABASE timeflow;
```

### 4. Generar Documentación Swagger

```bash
swag init -g main.go -o ./docs
# o con Make
make swagger
```

### 5. Ejecutar la Aplicación

```bash
go run main.go
# o con Make
make run
```

**Salida esperada:**

```
Database connected successfully
Database schema migrations completed
Running custom migrations...
✓ Index created/verified: idx_users_area_id on users
✓ Index created/verified: idx_projects_area_id on projects
...
Custom migrations completed: 13/13 indexes applied
[GIN-debug] Listening and serving HTTP on :8080
```

**URLs disponibles:**

- API: `http://localhost:8080/api/v1`
- Swagger: `http://localhost:8080/swagger/index.html`

---

## 🏗️ Arquitectura

### Estructura del Proyecto

```
backend/
├── config/               # Configuración de BD
│   └── database.go      # Conexión, migraciones automáticas
├── constants/           # Constantes centralizadas
│   └── constants.go     # Roles, estados, mensajes
├── handlers/            # Controladores HTTP
│   ├── auth.go         # Autenticación
│   ├── users.go        # Gestión de usuarios
│   ├── areas.go        # Gestión de áreas
│   ├── projects.go     # Gestión de proyectos
│   ├── tasks.go        # Gestión de tareas
│   ├── activities.go   # Registro de actividades
│   ├── calendar.go     # Integración con MS Calendar
│   ├── comments.go     # Comentarios
│   └── stats.go        # Estadísticas
├── helpers/             # Funciones utilitarias
│   └── helpers.go      # Parsing, autorización, cálculos
├── middleware/          # Middlewares
│   ├── auth.go         # Autenticación JWT
│   ├── authorization.go # Autorización por roles
│   └── cors.go         # CORS
├── models/              # Modelos de datos
│   ├── user.go
│   ├── area.go
│   ├── project.go
│   ├── task.go
│   ├── activity.go
│   ├── assignment.go
│   └── comment.go
├── routes/              # Definición de rutas
│   └── routes.go
├── services/            # Lógica de negocio
│   ├── project_service.go
│   └── activity_service.go
├── utils/               # Utilidades específicas
│   ├── jwt.go          # Generación y validación JWT
│   ├── microsoft.go    # Integración con MS Graph
│   ├── calendar.go     # Funciones de calendario
│   └── response.go     # Respuestas estandarizadas
├── docs/                # Documentación Swagger generada
├── migrations/          # Migraciones SQL adicionales
├── main.go              # Punto de entrada
├── go.mod
└── go.sum
```

### Capas de la Aplicación

```
Request
  ↓
Routes (routes.go)
  ↓
Middleware (auth, cors, authorization)
  ↓
Handlers (controllers HTTP)
  ↓
Services (lógica de negocio)
  ↓
Models + GORM (ORM)
  ↓
PostgreSQL
```

---

## 📡 API Endpoints

### Base URL

```
http://localhost:8080/api/v1
```

### Autenticación

| Método | Endpoint           | Descripción                  | Auth            |
| ------ | ------------------ | ---------------------------- | --------------- |
| POST   | `/auth/login`      | Login local (email/password) | No              |
| POST   | `/auth/microsoft`  | Login con Microsoft OAuth    | No              |
| POST   | `/auth/register`   | Registro público de usuarios | No              |
| GET    | `/auth/me`         | Obtener usuario actual       | Sí              |
| POST   | `/auth/superadmin` | Crear SuperAdmin             | Sí (SuperAdmin) |

### Usuarios

| Método | Endpoint     | Descripción                        | Auth            |
| ------ | ------------ | ---------------------------------- | --------------- |
| GET    | `/users`     | Listar usuarios (filtrado por rol) | Sí              |
| GET    | `/users/:id` | Obtener usuario por ID             | Sí              |
| POST   | `/users`     | Crear usuario                      | Sí (Admin+)     |
| PUT    | `/users/:id` | Actualizar usuario                 | Sí (Admin+)     |
| DELETE | `/users/:id` | Eliminar usuario                   | Sí (SuperAdmin) |

### Áreas

| Método | Endpoint     | Descripción         | Auth            |
| ------ | ------------ | ------------------- | --------------- |
| GET    | `/areas`     | Listar áreas        | Sí              |
| GET    | `/areas/:id` | Obtener área por ID | Sí              |
| POST   | `/areas`     | Crear área          | Sí (SuperAdmin) |
| PUT    | `/areas/:id` | Actualizar área     | Sí (SuperAdmin) |
| DELETE | `/areas/:id` | Eliminar área       | Sí (SuperAdmin) |

### Proyectos

| Método | Endpoint                            | Descripción                         | Auth        |
| ------ | ----------------------------------- | ----------------------------------- | ----------- |
| GET    | `/projects`                         | Listar proyectos (filtrado por rol) | Sí          |
| GET    | `/projects/:id`                     | Obtener proyecto por ID             | Sí          |
| POST   | `/projects`                         | Crear proyecto                      | Sí          |
| PUT    | `/projects/:id`                     | Actualizar proyecto                 | Sí          |
| PATCH  | `/projects/:id/status`              | Cambiar estado                      | Sí          |
| DELETE | `/projects/:id`                     | Eliminar proyecto                   | Sí          |
| POST   | `/projects/:id/assignments`         | Asignar usuarios                    | Sí (Admin+) |
| DELETE | `/projects/:id/assignments/:userId` | Desasignar usuario                  | Sí (Admin+) |

### Tareas

| Método | Endpoint                         | Descripción                      | Auth        |
| ------ | -------------------------------- | -------------------------------- | ----------- |
| GET    | `/tasks`                         | Listar tareas (filtrado por rol) | Sí          |
| GET    | `/tasks/:id`                     | Obtener tarea por ID             | Sí          |
| POST   | `/tasks`                         | Crear tarea                      | Sí          |
| PUT    | `/tasks/:id`                     | Actualizar tarea                 | Sí          |
| PATCH  | `/tasks/:id/status`              | Cambiar estado                   | Sí          |
| PATCH  | `/tasks/bulk-order`              | Reordenar múltiples tareas       | Sí          |
| DELETE | `/tasks/:id`                     | Eliminar tarea                   | Sí          |
| POST   | `/tasks/:id/assignments`         | Asignar usuarios                 | Sí (Admin+) |
| DELETE | `/tasks/:id/assignments/:userId` | Desasignar usuario               | Sí (Admin+) |

### Actividades

| Método | Endpoint          | Descripción                           | Auth |
| ------ | ----------------- | ------------------------------------- | ---- |
| GET    | `/activities`     | Listar actividades (filtrado por rol) | Sí   |
| GET    | `/activities/:id` | Obtener actividad por ID              | Sí   |
| POST   | `/activities`     | Crear actividad                       | Sí   |
| PUT    | `/activities/:id` | Actualizar actividad                  | Sí   |
| DELETE | `/activities/:id` | Eliminar actividad                    | Sí   |

### Calendario

| Método | Endpoint           | Descripción      | Auth |
| ------ | ------------------ | ---------------- | ---- |
| POST   | `/calendar/today`  | Eventos de hoy   | Sí   |
| POST   | `/calendar/events` | Eventos en rango | Sí   |

### Estadísticas

| Método | Endpoint            | Descripción                 | Auth |
| ------ | ------------------- | --------------------------- | ---- |
| GET    | `/stats/activities` | Estadísticas de actividades | Sí   |
| GET    | `/stats/monthly`    | Estadísticas mensuales      | Sí   |

---

## 🔐 Sistema de Autenticación

### Login Local

**Request:**

```json
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@timeflow.com",
  "password": "admin123"
}
```

**Response:**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "admin@timeflow.com",
      "full_name": "Super Admin",
      "role": "superadmin",
      "area_id": null,
      "is_active": true,
      "auth_provider": "local"
    }
  }
}
```

### Login con Microsoft OAuth

**Flujo:**

1. Frontend obtiene `access_token` de Microsoft usando MSAL
2. Frontend envía token a backend
3. Backend valida token con Microsoft Graph API
4. Backend busca/crea usuario en BD
5. Backend retorna JWT propio

**Request:**

```json
POST /api/v1/auth/microsoft
Content-Type: application/json

{
  "access_token": "EwBwA8l6BAAURSN/FStslH..."
}
```

**Response:** Igual formato que login local

### Flujo de Aprobación de Usuarios

Para usuarios nuevos con Microsoft OAuth:

1. Usuario inicia sesión → Se crea con `is_active: false`
2. Backend retorna:

```json
{
  "status": "success",
  "message": "Account created. Waiting for administrator approval",
  "data": {
    "user": {...},
    "pending_approval": true
  }
}
```

3. SuperAdmin aprueba desde el dashboard
4. Usuario puede iniciar sesión normalmente

### Uso del Token JWT

Incluir en todas las peticiones protegidas:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 👥 Sistema de Roles y Permisos

### Roles Disponibles

```go
const (
    RoleSuperAdmin = "superadmin"  // Acceso total
    RoleAdmin      = "admin"        // Acceso a su área
    RoleUser       = "user"         // Acceso a proyectos asignados
)
```

### Matriz de Permisos

| Acción                     | SuperAdmin | Admin de Área        | Usuario             |
| -------------------------- | ---------- | -------------------- | ------------------- |
| Ver todas las áreas        | ✅         | ❌                   | ❌                  |
| Crear/editar áreas         | ✅         | ❌                   | ❌                  |
| Ver todos los usuarios     | ✅         | ❌ (solo su área)    | ❌                  |
| Crear usuarios             | ✅         | ✅ (solo de su área) | ❌                  |
| Aprobar usuarios Microsoft | ✅         | ❌                   | ❌                  |
| Ver todos los proyectos    | ✅         | ❌ (solo su área)    | ❌ (solo asignados) |
| Crear proyectos de área    | ✅         | ✅                   | ❌                  |
| Crear proyectos personales | ✅         | ✅                   | ✅                  |
| Asignar proyectos/tareas   | ✅         | ✅ (solo en su área) | ❌                  |
| Registrar actividades      | ✅         | ✅                   | ✅                  |
| Ver estadísticas globales  | ✅         | ❌                   | ❌                  |

### Implementación en Código

```go
// Middleware de autorización
func RequireRole(roles ...string) gin.HandlerFunc {
    return func(c *gin.Context) {
        userRole := c.GetString("role")
        for _, role := range roles {
            if userRole == role {
                c.Next()
                return
            }
        }
        c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
        c.Abort()
    }
}

// Uso en rutas
api.GET("/users", middleware.RequireAuth(), middleware.RequireRole("superadmin", "admin"), handlers.GetUsers)
```

---

## 🗄️ Base de Datos y Optimización

### Sistema de Migraciones Automáticas

El backend ejecuta automáticamente al iniciar:

1. **AutoMigrate de GORM**: Crea/actualiza tablas
2. **Índices personalizados**: 13 índices para optimización

### Índices Creados

**Tabla `users`:**

```sql
CREATE INDEX idx_users_area_id ON users(area_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;
```

**Tabla `projects`:**

```sql
CREATE INDEX idx_projects_area_id ON projects(area_id);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_assigned_user_id ON projects(assigned_user_id);
CREATE INDEX idx_projects_is_active ON projects(is_active) WHERE deleted_at IS NULL;
```

**Tabla `activities`:**

```sql
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_project_id ON activities(project_id);
CREATE INDEX idx_activities_area_id ON activities(area_id);
CREATE INDEX idx_activities_date ON activities(date);
CREATE INDEX idx_activities_user_date ON activities(user_id, date DESC);
```

**Tabla `tasks`:**

```sql
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
```

### Logger de Queries Lentas

Configurado para registrar queries >200ms:

```go
SlowThreshold: 200 * time.Millisecond
LogLevel:      logger.Info
```

**Salida de ejemplo:**

```
[SLOW SQL >= 200ms] [30.5s] [rows:1250] SELECT * FROM users WHERE area_id = 1
⚠️ Query lenta detectada
```

### Mejoras de Rendimiento

| Query                   | Antes    | Después | Mejora  |
| ----------------------- | -------- | ------- | ------- |
| Usuarios por área       | 30+ seg  | < 50ms  | 600x    |
| Proyectos por creador   | 5-10 seg | < 100ms | 50-100x |
| Actividades por usuario | 3-8 seg  | < 80ms  | 37-100x |

---

## 🎯 Sistema de Asignaciones

### Asignaciones Múltiples

Desde la refactorización, proyectos y tareas soportan **múltiples usuarios asignados**.

### Modelos de Asignación

**ProjectAssignment:**

```go
type ProjectAssignment struct {
    ID           uint
    ProjectID    uint
    UserID       uint
    AssignedBy   uint
    AssignedAt   time.Time
    CanModify    bool        // Permiso para modificar
    IsActive     bool
    UnassignedAt *time.Time
}
```

**TaskAssignment:**

```go
type TaskAssignment struct {
    ID           uint
    TaskID       uint
    UserID       uint
    AssignedBy   uint
    AssignedAt   time.Time
    CanModify    bool
    IsActive     bool
    UnassignedAt *time.Time
}
```

### Asignar Usuarios a Proyecto

```json
POST /api/v1/projects/:id/assignments
Authorization: Bearer <token>

{
  "user_ids": [5, 8, 12],
  "can_modify": true
}
```

### Desasignar Usuario de Proyecto

```json
DELETE /api/v1/projects/:id/assignments/:userId
Authorization: Bearer <token>
```

### Lógica de Permisos

- **Asignado a Proyecto**: Puede modificar cualquier tarea del proyecto
- **Asignado a Tarea**: Solo puede modificar esa tarea específica
- **Admin de Área**: Puede modificar todo en su área
- **SuperAdmin**: Puede modificar todo

---

## 🚀 Deployment

### Checklist Pre-Deployment

- [ ] Cambiar `JWT_SECRET` (mínimo 32 caracteres aleatorios)
- [ ] Cambiar contraseña del SuperAdmin
- [ ] Configurar `DB_SSLMODE=require`
- [ ] Habilitar HTTPS
- [ ] Configurar CORS solo para dominios permitidos
- [ ] Configurar `GIN_MODE=release`
- [ ] Deshabilitar Swagger (opcional)
- [ ] Configurar logs
- [ ] Configurar backup automático de BD

### Variables de Entorno de Producción

```env
# Database (PostgreSQL en la nube)
DB_HOST=tu-servidor-db.postgres.database.azure.com
DB_PORT=5432
DB_USER=timeflow_admin
DB_PASSWORD=************
DB_NAME=timeflow_prod
DB_SSLMODE=require

# Server
PORT=8080
GIN_MODE=release

# JWT (CAMBIAR)
JWT_SECRET=un_secreto_muy_largo_y_aleatorio_de_al_menos_32_caracteres

# Microsoft OAuth
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_TENANT_ID=tu_tenant_id
MICROSOFT_REDIRECT_URI=https://timeflow.tuempresa.com/auth/callback

# CORS
ALLOWED_ORIGINS=https://timeflow.tuempresa.com
```

### Opción 1: Azure App Service (Recomendado)

```bash
# 1. Crear App Service
az webapp create \
  --resource-group timeflow-rg \
  --plan timeflow-plan \
  --name timeflow-api \
  --runtime "GO:1.21"

# 2. Configurar variables de entorno
az webapp config appsettings set \
  --resource-group timeflow-rg \
  --name timeflow-api \
  --settings @backend-settings.json

# 3. Deploy
az webapp deployment source config \
  --resource-group timeflow-rg \
  --name timeflow-api \
  --repo-url https://github.com/Jaliko05/time-flow \
  --branch main \
  --manual-integration
```

### Opción 2: Docker

**Dockerfile:**

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

**Construir y ejecutar:**

```bash
docker build -t timeflow-backend .
docker run -p 8080:8080 --env-file .env timeflow-backend
```

### Opción 3: Docker Compose

Ver `backend/docker-compose.yml` para configuración completa con PostgreSQL.

---

## 🧪 Testing

### Testing con PowerShell

**Variables:**

```powershell
$BASE_URL = "http://localhost:8080/api/v1"
$TOKEN = "tu_jwt_token"
$HEADERS = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}
```

**Login:**

```powershell
$loginData = @{
    email = "admin@timeflow.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginData -ContentType "application/json"
$TOKEN = $response.data.token
```

**Crear Proyecto:**

```powershell
$projectData = @{
    name = "Proyecto de Prueba"
    description = "Descripción del proyecto"
    project_type = "personal"
    estimated_hours = 40
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/projects" -Method Post -Headers $HEADERS -Body $projectData
```

**Listar Proyectos:**

```powershell
$projects = Invoke-RestMethod -Uri "$BASE_URL/projects" -Headers $HEADERS
$projects.data | Format-Table id, name, status, estimated_hours
```

Ver archivo completo: `TESTING_COMMANDS.md`

---

## 🔧 Troubleshooting

### Error: Query lenta (30+ segundos)

**Causa:** Índice faltante en columna `area_id`

**Solución:** Las migraciones automáticas lo crean. Si persiste:

```sql
CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id);
```

### Error: "Key validation failed on 'ProjectType'"

**Causa:** `project_type` no es "personal" o "area"

**Solución:** Verificar que el valor sea exactamente:

```json
{
  "project_type": "personal" // o "area"
}
```

### Error: "Only admins can create area projects"

**Causa:** Usuario sin rol de admin intenta crear proyecto de área

**Solución:** Verificar rol del usuario:

```sql
SELECT id, email, role, area_id FROM users WHERE email = 'usuario@example.com';
```

### Error: "Database connection failed"

**Causa:** PostgreSQL no está corriendo o credenciales incorrectas

**Solución:**

```bash
# Verificar PostgreSQL
psql -U postgres -c "SELECT version();"

# Verificar variables de entorno
cat .env | grep DB_
```

### Error: "Unauthorized" (401)

**Causa:** Token JWT expirado o inválido

**Solución:** Hacer login nuevamente para obtener un nuevo token

### Error: "Forbidden" (403)

**Causa:** Usuario no tiene permisos para la acción

**Solución:** Verificar rol del usuario y matriz de permisos

---

## 📚 Referencias

- [Gin Framework](https://gin-gonic.com/)
- [GORM](https://gorm.io/)
- [Swagger](https://swagger.io/)
- [JWT](https://jwt.io/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/)

---

## 👤 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.
