# ⏱️ Time Flow

Sistema completo de gestión de tiempo, proyectos y actividades con control de acceso por roles y áreas. Combina funcionalidades de planner/kanban con registro de actividades diarias.

## 🌟 Características Principales

- 🔐 **Autenticación Dual** - Local (email/password) + OAuth 2.0 (Microsoft Azure AD)
- 👥 **Sistema de Roles** - SuperAdmin, Admin de Área y Usuarios con permisos granulares
- 🏢 **Gestión por Áreas** - Control departamental con aprobación de usuarios
- 📋 **Planner/Kanban** - Gestión visual de proyectos y tareas
- ⏱️ **Registro de Actividades** - Seguimiento detallado de tiempo con métricas automáticas
- 🎯 **Asignaciones Múltiples** - Asignar proyectos/tareas a múltiples usuarios
- 📊 **Seguimiento en Tiempo Real** - Actualización automática de horas y progreso
- 📈 **Estadísticas y Reportes** - Dashboard con análisis de productividad
- 📅 **Integración con Microsoft Calendar** - Conversión de reuniones en actividades
- 📱 **Interfaz Responsiva** - Diseño moderno con Tailwind CSS y Shadcn/ui
- 📚 **API Documentada** - Swagger UI interactiva
- ⚡ **Optimización de BD** - Índices automáticos para queries rápidas

## 🎯 Perfiles de Usuario y Flujo de Aprobación

### Flujo de Registro con Microsoft OAuth

1. **Usuario nuevo** inicia sesión con Microsoft → Se crea cuenta inactiva
2. **SuperAdmin** ve notificación de usuario pendiente
3. **SuperAdmin** aprueba, asigna rol y área
4. **Usuario** puede acceder al sistema con permisos asignados

### SuperAdmin

- Acceso completo al sistema
- Gestión de áreas y aprobación de usuarios
- Vista global de todos los proyectos y actividades
- Estadísticas de toda la organización
- Creación de otros SuperAdmins

### Admin de Área

- Gestión de usuarios de su área específica
- Creación de proyectos personales y de área
- Asignación múltiple de proyectos/tareas a usuarios del área
- Seguimiento de actividades y tareas del área
- Estadísticas del área

### Usuario

- Gestión de proyectos personales
- Vista de proyectos y tareas asignadas
- Registro de actividades diarias
- Vinculación de actividades a proyectos/tareas
- Estadísticas personales
- Conversión de reuniones de calendario en actividades

## 🏗️ Arquitectura

### Backend (Go)

- **Framework**: Gin
- **ORM**: GORM con migraciones automáticas
- **Base de Datos**: PostgreSQL con índices optimizados
- **Autenticación**: JWT + OAuth 2.0 (Microsoft)
- **Documentación**: Swagger/OpenAPI
- **Arquitectura**: Servicios + Handlers + Helpers

### Frontend (React)

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **Autenticación**: MSAL (Microsoft Authentication Library)
- **UI Components**: Shadcn/ui
- **Estilos**: Tailwind CSS
- **HTTP Client**: Axios
- **Hooks Personalizados**: useProjects, useAuth

## 📦 Modelos de Datos

### Jerarquía

```
Area (Departamento)
├── Users (Usuarios del área)
├── Projects (Proyectos del área/personales)
    ├── ProjectAssignments (Asignaciones múltiples)
    └── Tasks (Tareas del proyecto)
        ├── TaskAssignments (Asignaciones múltiples)
        └── Activities (Tiempo registrado)
```

### Estados y Prioridades

**Estados de Proyecto:**

- `unassigned` - Sin asignar
- `assigned` - Asignado a usuario(s)
- `in_progress` - En progreso
- `paused` - Pausado
- `completed` - Completado

**Estados de Tarea:**

- `backlog` - En backlog
- `assigned` - Asignada a usuario(s)
- `in_progress` - En progreso
- `paused` - Pausada
- `completed` - Completada

**Prioridades:**

- `low` - Baja (Verde)
- `medium` - Media (Amarilla)
- `high` - Alta (Naranja)
- `urgent` - Urgente (Roja)

## 📋 Requisitos

- **Go** 1.21 o superior
- **Node.js** 18 o superior + pnpm
- **PostgreSQL** 13 o superior
- **Cuenta de Azure AD** (opcional, para OAuth)

## 🚀 Instalación Rápida

### 1. Base de Datos

```sql
-- Conectar a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE timeflow;
```

### 2. Configurar Backend

```powershell
cd backend

# Crear archivo .env
@"
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=timeflow
DB_SSLMODE=disable

PORT=8080
GIN_MODE=debug

JWT_SECRET=cambia_este_secreto_en_produccion_minimo_32_caracteres

# Microsoft OAuth (opcional)
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_TENANT_ID=tu_tenant_id
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback
"@ | Out-File -FilePath .env -Encoding UTF8

# Instalar y ejecutar
go mod download
go run main.go
```

**El backend:**

- Aplicará migraciones automáticamente
- Creará índices para optimización
- Creará usuario SuperAdmin por defecto
- Estará disponible en: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/swagger/index.html`

### 3. Configurar Frontend

```powershell
cd frontend

# Crear archivo .env
@"
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_MICROSOFT_CLIENT_ID=tu_client_id
VITE_MICROSOFT_TENANT_ID=tu_tenant_id
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback
"@ | Out-File -FilePath .env -Encoding UTF8

# Instalar y ejecutar
pnpm install
pnpm dev
```

**El frontend estará disponible en: `http://localhost:5173`**

### 4. Primer Acceso

**Credenciales por defecto:**

- Email: `admin@timeflow.com`
- Password: `admin123`

⚠️ **IMPORTANTE:** Cambiar esta contraseña después del primer inicio de sesión.

## 📚 Documentación Adicional

- **[Backend Documentation](./backend/DOCUMENTATION.md)** - API completa, configuración y deployment
- **[Frontend Documentation](./frontend/DOCUMENTATION.md)** - Componentes, autenticación y desarrollo

## 🚀 Deployment a Producción

### Checklist de Seguridad

- [ ] Cambiar `JWT_SECRET` (mínimo 32 caracteres aleatorios)
- [ ] Cambiar contraseña del SuperAdmin
- [ ] Configurar `DB_SSLMODE=require`
- [ ] Habilitar HTTPS
- [ ] Configurar CORS solo para dominios permitidos
- [ ] Configurar `GIN_MODE=release`

### Opciones de Deployment

1. **Azure App Service** (Recomendado)
2. **Docker + Docker Compose**
3. **Servidores VPS** (DigitalOcean, Linode)

Ver guía completa en [backend/DOCUMENTATION.md](./backend/DOCUMENTATION.md#deployment)

## ⚡ Performance

### Optimizaciones Implementadas

- **Migraciones automáticas**: 13 índices aplicados al inicio
- **Queries optimizadas**: De 30+ segundos a <100ms
- **Logger de queries lentas**: Detecta queries >200ms
- **Actualización en tiempo real**: Horas y progreso calculados automáticamente

### Resultados

| Query                   | Antes    | Después |
| ----------------------- | -------- | ------- |
| Usuarios por área       | 30+ seg  | < 50ms  |
| Proyectos por creador   | 5-10 seg | < 100ms |
| Actividades por usuario | 3-8 seg  | < 80ms  |

## 🔧 Troubleshooting

### Error: Query lenta de usuarios por área

**Solución:** Las migraciones automáticas crean el índice. Si persiste:

```sql
CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id);
```

### Error: "onSave is not a function"

Ya corregido en `ProjectFormDialog.jsx`. Asegúrate de tener la última versión.

### Error: "Usuario pendiente de aprobación"

Normal para nuevos usuarios con Microsoft OAuth. El SuperAdmin debe aprobar desde Dashboard > Usuarios.

### Error: No se pueden crear proyectos de área

Verifica que:

1. El usuario sea Admin de Área o SuperAdmin
2. Tenga un área asignada (`area_id`)
3. El `project_type` sea exactamente `"area"` o `"personal"`

## 🤝 Contribución

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crea un Pull Request

## 📄 Licencia

Este proyecto es privado y propietario.

## 👤 Contacto

Para soporte y preguntas, contacta al equipo de desarrollo.

- Acceso a sus propios datos
- Creación y gestión de proyectos personales
- Registro de actividades diarias
- Vista de sus estadísticas

## 📊 Módulos del Sistema

### 1. Áreas

Departamentos o equipos de la organización.

- Cada área tiene un Admin
- Los usuarios pertenecen a un área

### 2. Usuarios

Personas que utilizan el sistema.

- Roles: SuperAdmin, Admin, User
- Pertenecen a un área
- Configuración de horario laboral

### 3. Proyectos

Proyectos personales de cada usuario.

- Asignados al usuario creador
- Pueden asociarse a actividades

### 4. Actividades

Registro de tiempo trabajado.

- Asociadas a proyectos o tareas
- Tipos de actividad predefinidos
- Fecha y tiempo de ejecución
- Observaciones

## 🔌 API Endpoints

### Autenticación

- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Usuario actual

### Áreas

- `GET /api/v1/areas` - Listar
- `POST /api/v1/areas` - Crear (SuperAdmin)
- `PUT /api/v1/areas/:id` - Actualizar (SuperAdmin)
- `DELETE /api/v1/areas/:id` - Eliminar (SuperAdmin)

### Usuarios

- `GET /api/v1/users` - Listar (Admin/SuperAdmin)
- `POST /api/v1/users` - Crear (Admin/SuperAdmin)
- `PUT /api/v1/users/:id` - Actualizar
- `DELETE /api/v1/users/:id` - Eliminar (SuperAdmin)

### Proyectos

- `GET /api/v1/projects` - Listar
- `POST /api/v1/projects` - Crear
- `PUT /api/v1/projects/:id` - Actualizar
- `DELETE /api/v1/projects/:id` - Eliminar

### Actividades

- `GET /api/v1/activities` - Listar
- `GET /api/v1/activities/stats` - Estadísticas
- `POST /api/v1/activities` - Crear
- `PUT /api/v1/activities/:id` - Actualizar
- `DELETE /api/v1/activities/:id` - Eliminar

## 📚 Documentación

- **API Swagger**: http://localhost:8080/swagger/index.html
- **Instalación Detallada**: [INSTALLATION.md](INSTALLATION.md)
- **Backend README**: [backend/README.md](backend/README.md)

## 🛠️ Desarrollo

### Backend

```bash
cd backend

# Generar docs Swagger
swag init -g main.go -o ./docs

# Ejecutar
go run main.go

# Compilar
go build -o bin/timeflow main.go
```

### Frontend

```bash
cd frontend

# Desarrollo
npm run dev

# Build producción
npm run build

# Preview producción
npm run preview
```

## 🧪 Testing

### Probar con Swagger UI

1. Accede a http://localhost:8080/swagger/index.html
2. Haz login con el endpoint `/auth/login`
3. Autoriza con el token recibido
4. Prueba los endpoints

### Probar con curl

```bash
# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@timeflow.com","password":"admin123"}'

# Usar token
curl http://localhost:8080/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Tipos de Actividad

- Plan de Trabajo
- Apoyo Solicitado por Otras Áreas
- Teams
- Interno
- Sesión
- Investigación
- Prototipado
- Diseños
- Pruebas
- Documentación

## 🔐 Seguridad

- Autenticación JWT
- Passwords hasheados con bcrypt
- Tokens con expiración
- CORS configurado
- SQL injection protegido (GORM)
- XSS protegido (React)

## 📧 Contacto

- **Autor**: Javier Puentes
- **GitHub**: [@Jaliko05](https://github.com/Jaliko05)
- **Proyecto**: [time-flow](https://github.com/Jaliko05/time-flow)

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo LICENSE para más detalles.

---

⭐ Si este proyecto te fue útil, considera darle una estrella en GitHub!
