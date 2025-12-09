# ⏱️ Time Flow

Sistema completo de gestión de tiempo, proyectos y actividades con control de acceso por roles y áreas. Combina funcionalidades de planner/kanban con registro de actividades diarias.

## 🌟 Características Principales

- 🔐 **Autenticación OAuth 2.0** - Integración con Microsoft Azure AD
- 👥 **Sistema de Roles** - SuperAdmin, Admin de Área y Usuarios
- 🏢 **Gestión por Áreas** - Control granular de permisos por departamento
- 📋 **Planner/Kanban** - Gestión de proyectos y tareas con vista Kanban
- ⏱️ **Registro de Actividades** - Seguimiento detallado de tiempo invertido
- 🎯 **Asignación de Tareas** - Los admins pueden asignar proyectos y tareas a usuarios
- 📊 **Seguimiento de Progreso** - Métricas automáticas de horas y completitud
- 📈 **Estadísticas y Reportes** - Análisis de productividad y tiempo
- 📅 **Integración con Calendar** - Conversión de reuniones en actividades
- 📱 **Interfaz Responsiva** - Diseño moderno con Tailwind CSS
- 📚 **API Documentada** - Swagger UI interactiva

## 🎯 Perfiles de Usuario

### SuperAdmin

- Acceso completo al sistema
- Gestión de áreas y usuarios
- Vista global de todos los proyectos y actividades
- Estadísticas de toda la organización

### Admin de Área

- Gestión de usuarios de su área
- Creación de proyectos de área
- Asignación de proyectos y tareas a usuarios
- Seguimiento de actividades del área
- Estadísticas del área

### Usuario

- Gestión de proyectos personales
- Vista de proyectos y tareas asignadas
- Registro de actividades diarias
- Vinculación de actividades a proyectos/tareas
- Estadísticas personales

## 🏗️ Arquitectura

### Backend (Go)

- **Framework**: Gin
- **ORM**: GORM
- **Base de Datos**: PostgreSQL
- **Autenticación**: JWT + OAuth 2.0 (Microsoft)
- **Documentación**: Swagger/OpenAPI

### Frontend (React)

- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: React Query (TanStack Query)
- **UI Components**: Shadcn/ui
- **Estilos**: Tailwind CSS
- **HTTP Client**: Axios

## 📦 Modelos de Datos

### Jerarquía

```
Area (Departamento)
├── Users (Usuarios del área)
├── Projects (Proyectos del área)
    └── Tasks (Tareas del proyecto)
        └── Activities (Actividades registradas en la tarea)
```

### Estados de Proyecto

- `unassigned` - Sin asignar
- `assigned` - Asignado a usuario
- `in_progress` - En progreso
- `paused` - Pausado
- `completed` - Completado

### Estados de Tarea

- `backlog` - En backlog
- `assigned` - Asignada a usuario
- `in_progress` - En progreso
- `paused` - Pausada
- `completed` - Completada

## 📋 Requisitos

- Go 1.21 o superior
- Node.js 18 o superior
- PostgreSQL 13 o superior
- Cuenta de Azure AD (para OAuth)

## 🚀 Instalación Rápida

### Opción 1: Script Automático (Windows)

```powershell
# Clonar el repositorio
git clone https://github.com/Jaliko05/time-flow.git
cd time-flow

# Ejecutar setup
.\setup.ps1

# Crear la base de datos
psql -U postgres -c "CREATE DATABASE timeflow;"

# Ejecutar el proyecto
.\run.ps1
```

### Opción 2: Manual

Ver [INSTALLATION.md](INSTALLATION.md) para instrucciones detalladas.

## 🔑 Acceso Inicial

Una vez iniciado el sistema, accede con:

- **URL**: http://localhost:5173
- **Email**: admin@timeflow.com
- **Password**: admin123
- **Rol**: SuperAdmin

## 📂 Estructura del Proyecto

```
time-flow/
├── backend/              # API en Go
│   ├── config/          # Configuración de BD
│   ├── handlers/        # Controladores HTTP
│   ├── middleware/      # Middlewares
│   ├── models/          # Modelos de datos
│   ├── routes/          # Rutas de la API
│   ├── utils/           # Utilidades
│   └── main.go          # Punto de entrada
│
├── frontend/            # Aplicación React
│   ├── src/
│   │   ├── api/        # Clientes API
│   │   ├── components/ # Componentes React
│   │   ├── pages/      # Páginas
│   │   └── hooks/      # Hooks personalizados
│   └── package.json
│
├── setup.ps1            # Script de instalación
├── run.ps1              # Script para ejecutar
└── INSTALLATION.md      # Guía detallada
```

## 👥 Sistema de Roles

### 🔴 SuperAdmin

- Acceso total al sistema
- Gestión de todas las áreas
- Gestión de todos los usuarios
- Vista consolidada de todas las actividades
- Único rol que puede eliminar áreas y usuarios

### 🟡 Admin

- Acceso limitado a su área asignada
- Gestión de usuarios de su área
- Creación de usuarios regulares
- Vista de actividades de su área
- No puede cambiar roles de usuarios

### 🟢 User

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
