# Time Flow Backend

API REST para el sistema de gestión de tiempo Time Flow, construida con Go, Gin, GORM y PostgreSQL.

## 🚀 Características

- **Autenticación Dual** - Login local (email/password) y Microsoft OAuth 2.0
- **Integración con Microsoft Calendar** - Ver y convertir reuniones en actividades (opcional)
- **JWT** con roles (SuperAdmin, Admin, User)
- **Control de acceso por áreas** - SuperAdmin ve todo, Admin solo su área
- **CRUD completo** para Usuarios, Áreas, Proyectos y Actividades
- **Estadísticas** de actividades con filtros avanzados
- **Documentación Swagger** interactiva
- **Base de datos PostgreSQL** con GORM
- **Migraciones automáticas**

## 📋 Requisitos

- Go 1.21 o superior
- PostgreSQL 13 o superior
- Make (opcional, para comandos simplificados)

## 🔧 Instalación

1. **Clonar el repositorio**

```bash
cd backend
```

2. **Instalar dependencias**

```bash
go mod download
# o con Make:
make install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

Variables importantes:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=timeflow

# JWT
JWT_SECRET=tu-secret-super-secreto
JWT_EXPIRATION_HOURS=24

# Microsoft OAuth (opcional, para autenticación con Microsoft)
MICROSOFT_CLIENT_ID=tu-client-id-de-azure
MICROSOFT_TENANT_ID=common
```

4. **Crear base de datos PostgreSQL**

```sql
CREATE DATABASE timeflow;
```

5. **Generar documentación Swagger**

```bash
swag init -g main.go -o ./docs
# o con Make:
make swagger
```

6. **Ejecutar la aplicación**

```bash
go run main.go
# o con Make:
make run
# o para desarrollo (genera swagger y ejecuta):
make dev
```

## 🌐 Endpoints

### Autenticación

- `POST /api/v1/auth/login` - Login local (email/password)
- `POST /api/v1/auth/microsoft` - Login con Microsoft OAuth
- `POST /api/v1/auth/register` - Registro público de usuarios
- `GET /api/v1/auth/me` - Obtener información del usuario actual
- `POST /api/v1/auth/superadmin` - Crear SuperAdmin (solo SuperAdmin)

### Áreas

- `GET /api/v1/areas` - Listar áreas
- `GET /api/v1/areas/:id` - Obtener área por ID
- `POST /api/v1/areas` - Crear área (SuperAdmin)
- `PUT /api/v1/areas/:id` - Actualizar área (SuperAdmin)
- `DELETE /api/v1/areas/:id` - Eliminar área (SuperAdmin)

### Usuarios

- `GET /api/v1/users` - Listar usuarios (Admin/SuperAdmin)
- `GET /api/v1/users/:id` - Obtener usuario por ID
- `POST /api/v1/users` - Crear usuario (Admin/SuperAdmin)
- `PUT /api/v1/users/:id` - Actualizar usuario
- `DELETE /api/v1/users/:id` - Eliminar usuario (SuperAdmin)

### Proyectos

- `GET /api/v1/projects` - Listar proyectos
- `GET /api/v1/projects/:id` - Obtener proyecto por ID
- `POST /api/v1/projects` - Crear proyecto
- `PUT /api/v1/projects/:id` - Actualizar proyecto
- `DELETE /api/v1/projects/:id` - Eliminar proyecto

### Actividades

- `GET /api/v1/activities` - Listar actividades
- `GET /api/v1/activities/stats` - Obtener estadísticas
- `GET /api/v1/activities/:id` - Obtener actividad por ID
- `POST /api/v1/activities` - Crear actividad
- `PUT /api/v1/activities/:id` - Actualizar actividad
- `DELETE /api/v1/activities/:id` - Eliminar actividad

### Calendario (Opcional - requiere Microsoft OAuth)

- `POST /api/v1/calendar/events` - Obtener eventos del calendario
- `POST /api/v1/calendar/today` - Obtener eventos de hoy

## 📚 Documentación Swagger

Una vez iniciada la aplicación, accede a:

**http://localhost:8080/swagger/index.html**

## 🔐 Autenticación

La API soporta **dos métodos de autenticación**:

### 1. Autenticación Local (Email/Password)

```json
POST /api/v1/auth/login
{
  "email": "admin@timeflow.com",
  "password": "admin123"
}
```

### 2. Autenticación con Microsoft

```json
POST /api/v1/auth/microsoft
{
  "access_token": "EwBwA8l6BAAURSN/..."
}
```

Ambos métodos retornan un JWT que debe usarse en el header `Authorization`:

```
Authorization: Bearer <token>
```

### Usuario por defecto

- **Email**: admin@timeflow.com
- **Password**: admin123
- **Role**: superadmin

## 👥 Sistema de Roles

### SuperAdmin

- Acceso total a todas las áreas
- Puede gestionar usuarios, áreas, proyectos y actividades
- Único rol que puede eliminar usuarios y áreas

### Admin

- Acceso limitado a su área asignada
- Puede ver y gestionar usuarios de su área
- Puede crear usuarios con rol "user" en su área
- Puede ver actividades de su área

### User

- Acceso solo a sus propios datos
- Puede crear y gestionar sus proyectos
- Puede registrar y modificar sus actividades

## 📝 Tipos de Actividades

- `plan_de_trabajo` - Plan de Trabajo
- `apoyo_solicitado_por_otras_areas` - Apoyo Solicitado por Otras Áreas
- `teams` - Teams
- `interno` - Interno
- `sesion` - Sesión
- `investigacion` - Investigación
- `prototipado` - Prototipado
- `disenos` - Diseños
- `pruebas` - Pruebas
- `documentacion` - Documentación

## 🔍 Filtros en Actividades

La API de actividades soporta múltiples filtros:

- `user_id` - Filtrar por ID de usuario
- `user_email` - Filtrar por email de usuario
- `area_id` - Filtrar por área
- `project_id` - Filtrar por proyecto
- `activity_type` - Filtrar por tipo de actividad
- `date` - Filtrar por fecha específica (YYYY-MM-DD)
- `month` - Filtrar por mes (YYYY-MM)
- `date_from` - Desde fecha (YYYY-MM-DD)
- `date_to` - Hasta fecha (YYYY-MM-DD)

Ejemplo:

```
GET /api/v1/activities?month=2024-11&activity_type=plan_de_trabajo
```

## 📊 Estadísticas

El endpoint `/api/v1/activities/stats` proporciona:

- Total de horas
- Total de actividades
- Usuarios únicos
- Promedio diario
- Distribución por tipo de actividad
- Distribución por área

## 🗂️ Estructura del Proyecto

```
backend/
├── config/          # Configuración de BD
├── docs/            # Documentación Swagger (auto-generada)
├── handlers/        # Controladores HTTP
├── middleware/      # Middlewares (auth, cors, etc)
├── models/          # Modelos de datos
├── routes/          # Definición de rutas
├── utils/           # Utilidades (JWT, responses, Microsoft)
├── main.go          # Punto de entrada
├── go.mod           # Dependencias Go
├── .env             # Variables de entorno
├── .env.example     # Variables de entorno ejemplo
├── README.md        # Este archivo
├── API.md           # Documentación detallada de endpoints
└── FRONTEND.md      # Guía de implementación frontend
```

## 🛠️ Comandos Make

```bash
make help       # Mostrar ayuda
make install    # Instalar dependencias
make swagger    # Generar documentación Swagger
make run        # Ejecutar aplicación
make dev        # Generar docs y ejecutar
make build      # Compilar aplicación
make test       # Ejecutar tests
make clean      # Limpiar archivos generados
```

## 🐳 Docker (Próximamente)

```bash
make docker-build   # Construir imagen
make docker-run     # Ejecutar contenedor
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

## 📖 Documentación Adicional

- **[API.md](./API.md)** - Documentación completa de todos los endpoints, errores, y ejemplos
- **[FRONTEND.md](./FRONTEND.md)** - Guía de implementación frontend con React, autenticación y calendario
