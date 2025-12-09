# 🚀 Guía de Inicio Rápido - Time Flow

## ✅ Lista de Verificación Pre-Inicio

- [ ] PostgreSQL instalado y corriendo
- [ ] Go 1.21+ instalado
- [ ] Node.js 18+ instalado
- [ ] Cuenta de Azure AD configurada (opcional, para OAuth)

## 📝 Configuración Inicial

### 1. Base de Datos

```sql
-- Conectar a PostgreSQL
psql -U postgres

-- Crear base de datos
CREATE DATABASE timeflow;

-- Crear usuario (opcional)
CREATE USER timeflow_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE timeflow TO timeflow_user;
```

### 2. Variables de Entorno - Backend

Crear archivo `.env` en la carpeta `backend/`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=timeflow
DB_SSLMODE=disable

# Server
PORT=8080
GIN_MODE=debug

# JWT
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion

# Microsoft OAuth (opcional)
MICROSOFT_CLIENT_ID=tu_client_id
MICROSOFT_CLIENT_SECRET=tu_client_secret
MICROSOFT_TENANT_ID=tu_tenant_id
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 3. Variables de Entorno - Frontend

Crear archivo `.env` en la carpeta `frontend/`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_MICROSOFT_CLIENT_ID=tu_client_id
VITE_MICROSOFT_TENANT_ID=tu_tenant_id
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback
```

## 🔧 Instalación

### Backend

```powershell
cd backend
go mod download
go run main.go
```

El backend estará disponible en: `http://localhost:8080`
Swagger UI: `http://localhost:8080/swagger/index.html`

### Frontend

```powershell
cd frontend
pnpm install
pnpm dev
```

El frontend estará disponible en: `http://localhost:5173`

## 👤 Usuario por Defecto

El sistema crea automáticamente un SuperAdmin:

- **Email**: `admin@timeflow.com`
- **Password**: `admin123`

⚠️ **IMPORTANTE**: Cambiar esta contraseña después del primer inicio de sesión.

## 📊 Flujo de Trabajo Recomendado

### Para SuperAdmin (Primera vez)

1. **Iniciar sesión** con credenciales por defecto
2. **Crear áreas** en `/admin`
   - Ejemplo: "Desarrollo", "Marketing", "Ventas"
3. **Crear usuarios admin** para cada área
4. **Asignar áreas** a los admins
5. Cambiar contraseña del SuperAdmin

### Para Admin de Área

1. **Iniciar sesión** con credenciales proporcionadas
2. **Crear usuarios** de su área en `/admin`
3. **Crear proyectos de área** en `/projects`
4. **Asignar proyectos** a usuarios
5. **Crear tareas** dentro de proyectos
6. **Asignar tareas** a usuarios específicos

### Para Usuario

1. **Iniciar sesión** (con Microsoft OAuth o credenciales)
2. **Ver dashboard** con proyectos y tareas asignadas
3. **Cambiar estado de tareas**:
   - Mover de Backlog → Asignado → En Progreso → Completado
4. **Registrar actividades diarias**:
   - Seleccionar proyecto/tarea
   - Indicar tiempo invertido
   - Agregar observaciones
5. **Ver estadísticas** personales

## 🎯 Casos de Uso Comunes

### Crear un Proyecto y Asignar Tareas

```
1. Admin → Projects → Nuevo Proyecto
   - Tipo: "Área"
   - Asignar a: Usuario específico
   - Horas estimadas: 40

2. Clic en el proyecto → Ver detalles
   - Nueva Tarea → "Diseñar base de datos"
     - Prioridad: Alta
     - Horas estimadas: 8
     - Asignar a: Usuario1

3. Usuario1 → Dashboard → Ve la tarea en "Asignado"
   - Clic derecho → Iniciar
   - Tarea pasa a "En Progreso"

4. Usuario1 → Activities → Nueva Actividad
   - Seleccionar proyecto
   - Seleccionar tarea
   - Tiempo: 2.5 horas
   - Registrar

5. El sistema actualiza automáticamente:
   - Horas usadas en tarea: 2.5h
   - Horas usadas en proyecto: 2.5h
   - Progreso de tarea: 31% (2.5/8)
```

### Registrar Actividades desde Reuniones

```
1. Usuario → Calendar → Ver eventos del día
2. Seleccionar reunión → "Registrar como actividad"
3. Se pre-llena:
   - Nombre: Título de reunión
   - Tipo: "Teams" o "Sesión"
   - Duración: Calculada del evento
4. Ajustar detalles → Guardar
```

## 🔍 Endpoints Principales

### Autenticación

- `POST /api/v1/auth/login` - Login tradicional
- `POST /api/v1/auth/microsoft` - Login con Microsoft
- `GET /api/v1/auth/me` - Usuario actual

### Proyectos

- `GET /api/v1/projects` - Listar proyectos
- `POST /api/v1/projects` - Crear proyecto
- `GET /api/v1/projects/:id` - Detalle de proyecto
- `PATCH /api/v1/projects/:id/status` - Cambiar estado

### Tareas

- `GET /api/v1/tasks` - Listar tareas
- `POST /api/v1/tasks` - Crear tarea
- `PATCH /api/v1/tasks/:id/status` - Cambiar estado

### Actividades

- `GET /api/v1/activities` - Listar actividades
- `POST /api/v1/activities` - Registrar actividad
- `GET /api/v1/activities/stats` - Estadísticas

## 🐛 Solución de Problemas

### Backend no inicia

```powershell
# Verificar PostgreSQL
psql -U postgres -c "SELECT version();"

# Verificar .env
cat backend/.env

# Ver logs detallados
cd backend
GIN_MODE=debug go run main.go
```

### Frontend no conecta con Backend

```powershell
# Verificar variables de entorno
cat frontend/.env

# Verificar CORS
# El backend debe permitir http://localhost:5173
```

### Errores de migración

```powershell
# Aplicar migración manual
cd backend
psql -U postgres -d timeflow -f migrations/add_tasks_support.sql
```

### Error de autenticación Microsoft

1. Verificar que el `MICROSOFT_CLIENT_ID` es correcto
2. Verificar que el `REDIRECT_URI` coincide en Azure AD
3. Verificar que los permisos están configurados:
   - `User.Read`
   - `Calendars.Read`

## 📚 Recursos Adicionales

- **Documentación completa**: Ver `REFACTORIZACION.md`
- **API Docs**: `http://localhost:8080/swagger/index.html`
- **Configuración Microsoft**: Ver `frontend/MICROSOFT_AUTH_SETUP.md`

## 🔐 Seguridad

### Producción

Antes de deployment:

1. ✅ Cambiar `JWT_SECRET` a un valor fuerte
2. ✅ Cambiar contraseña del SuperAdmin
3. ✅ Configurar `DB_SSLMODE=require`
4. ✅ Usar variables de entorno del servidor (no archivos .env)
5. ✅ Configurar CORS correctamente
6. ✅ Usar HTTPS en frontend y backend

## 💡 Mejores Prácticas

1. **Crear áreas** antes de crear usuarios
2. **Asignar usuarios a áreas** antes de crear proyectos
3. **Estimar horas** realisticamente en proyectos y tareas
4. **Registrar actividades diariamente** para mejor seguimiento
5. **Usar observaciones** para documentar el trabajo realizado
6. **Revisar progreso semanalmente** en dashboards

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs del backend en consola
2. Revisar consola del navegador (F12)
3. Verificar documentación de Swagger
4. Consultar `REFACTORIZACION.md` para detalles técnicos

---

**Versión**: 2.0  
**Última actualización**: Diciembre 2024
