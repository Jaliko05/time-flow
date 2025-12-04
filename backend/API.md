# 📡 API Documentation - TimeFlow

Documentación completa de todos los endpoints, errores comunes, y ejemplos de uso.

---

## 🔗 Base URL

```
http://localhost:8080/api/v1
```

---

## 🔐 Autenticación

La API soporta dos métodos de autenticación que retornan el mismo formato de respuesta (JWT).

### Login Local (Email/Password)

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "area_id": 2,
      "area": {
        "id": 2,
        "name": "Desarrollo"
      },
      "auth_provider": "local",
      "is_active": true
    }
  }
}
```

**Errores:**

- `400` - Email o password faltantes
- `401` - Credenciales inválidas
- `401` - Usuario inactivo

### Login con Microsoft OAuth

```http
POST /auth/microsoft
Content-Type: application/json

{
  "access_token": "EwBwA8l6BAAURSN/FStslH..."
}
```

**Flujo:**

1. Frontend obtiene `access_token` de Microsoft usando MSAL
2. Frontend envía token a este endpoint
3. Backend valida token con Microsoft Graph API
4. Backend busca/crea usuario en BD
5. Backend retorna JWT propio

**Respuesta exitosa:** Igual formato que login local

**Errores:**

- `400` - Access token faltante
- `401` - Token de Microsoft inválido o expirado
- `500` - Error al validar con Microsoft Graph API

### Registro de Usuario

```http
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "Jane Smith",
  "area_id": 2
}
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": 5,
    "email": "newuser@example.com",
    "full_name": "Jane Smith",
    "role": "user",
    "area_id": 2,
    "auth_provider": "local",
    "is_active": true
  }
}
```

**Errores:**

- `400` - Campos requeridos faltantes
- `400` - Email ya existe
- `404` - Área no encontrada

### Obtener Usuario Actual

```http
GET /auth/me
Authorization: Bearer <token>
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "area_id": 2,
    "area": {
      "id": 2,
      "name": "Desarrollo"
    }
  }
}
```

### Crear SuperAdmin

```http
POST /auth/superadmin
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123",
  "full_name": "Admin User"
}
```

**Requiere:** Role `superadmin`

**Errores:**

- `403` - No tienes permisos (no eres superadmin)
- `400` - Email ya existe

---

## 👥 Usuarios

### Listar Usuarios

```http
GET /users
Authorization: Bearer <token>
```

**Permisos:** Admin o SuperAdmin

**Comportamiento:**

- SuperAdmin: Ve todos los usuarios
- Admin: Ve solo usuarios de su área

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "user@example.com",
      "full_name": "John Doe",
      "role": "user",
      "area_id": 2,
      "area": {
        "id": 2,
        "name": "Desarrollo"
      },
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Obtener Usuario por ID

```http
GET /users/:id
Authorization: Bearer <token>
```

**Ejemplo:** `GET /users/5`

### Crear Usuario

```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "New User",
  "role": "user",
  "area_id": 2
}
```

**Permisos:**

- Admin: Puede crear usuarios con role "user" en su área
- SuperAdmin: Puede crear cualquier usuario en cualquier área

**Roles válidos:** `user`, `admin`, `superadmin`

### Actualizar Usuario

```http
PUT /users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "full_name": "Updated Name",
  "area_id": 3
}
```

**Permisos:**

- User: Solo puede actualizarse a sí mismo (excepto role)
- Admin: Puede actualizar usuarios de su área
- SuperAdmin: Puede actualizar cualquier usuario

### Eliminar Usuario

```http
DELETE /users/:id
Authorization: Bearer <token>
```

**Permisos:** Solo SuperAdmin

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 🏢 Áreas

### Listar Áreas

```http
GET /areas
Authorization: Bearer <token>
```

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Administración",
      "description": "Área de administración",
      "created_at": "2024-01-01T00:00:00Z"
    },
    {
      "id": 2,
      "name": "Desarrollo",
      "description": "Equipo de desarrollo",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Obtener Área por ID

```http
GET /areas/:id
Authorization: Bearer <token>
```

### Crear Área

```http
POST /areas
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Marketing",
  "description": "Área de marketing"
}
```

**Permisos:** Solo SuperAdmin

### Actualizar Área

```http
PUT /areas/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Marketing Digital",
  "description": "Área de marketing digital actualizada"
}
```

**Permisos:** Solo SuperAdmin

### Eliminar Área

```http
DELETE /areas/:id
Authorization: Bearer <token>
```

**Permisos:** Solo SuperAdmin

**Errores:**

- `400` - No se puede eliminar área con usuarios asignados

---

## 📁 Proyectos

### Listar Proyectos

```http
GET /projects
Authorization: Bearer <token>
```

**Filtros opcionales:**

- `user_id` - Filtrar por usuario
- `area_id` - Filtrar por área

**Ejemplo:** `GET /projects?area_id=2`

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Proyecto Alpha",
      "description": "Desarrollo de nueva funcionalidad",
      "user_id": 3,
      "user": {
        "id": 3,
        "full_name": "John Doe",
        "email": "john@example.com"
      },
      "created_at": "2024-11-01T00:00:00Z"
    }
  ]
}
```

### Obtener Proyecto por ID

```http
GET /projects/:id
Authorization: Bearer <token>
```

### Crear Proyecto

```http
POST /projects
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Nuevo Proyecto",
  "description": "Descripción del proyecto"
}
```

**Nota:** El proyecto se crea automáticamente asignado al usuario autenticado.

### Actualizar Proyecto

```http
PUT /projects/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Proyecto Actualizado",
  "description": "Nueva descripción"
}
```

**Permisos:** Solo el creador del proyecto

### Eliminar Proyecto

```http
DELETE /projects/:id
Authorization: Bearer <token>
```

**Permisos:** Solo el creador del proyecto

**Errores:**

- `400` - No se puede eliminar proyecto con actividades asociadas

---

## ⚡ Actividades

### Listar Actividades

```http
GET /activities
Authorization: Bearer <token>
```

**Filtros opcionales:**

- `user_id` - ID del usuario
- `user_email` - Email del usuario
- `area_id` - ID del área
- `project_id` - ID del proyecto
- `activity_type` - Tipo de actividad
- `date` - Fecha específica (YYYY-MM-DD)
- `month` - Mes (YYYY-MM)
- `date_from` - Desde fecha (YYYY-MM-DD)
- `date_to` - Hasta fecha (YYYY-MM-DD)

**Ejemplos:**

```
GET /activities?month=2024-11
GET /activities?date=2024-11-15
GET /activities?date_from=2024-11-01&date_to=2024-11-30
GET /activities?activity_type=teams&area_id=2
```

**Comportamiento por rol:**

- User: Ve solo sus actividades
- Admin: Ve actividades de su área
- SuperAdmin: Ve todas las actividades

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "date": "2024-11-15",
      "hours": 3.5,
      "description": "Desarrollo de API",
      "activity_type": "plan_de_trabajo",
      "notes": "Implementación de endpoints",
      "user_id": 3,
      "user": {
        "id": 3,
        "full_name": "John Doe",
        "email": "john@example.com",
        "area": {
          "id": 2,
          "name": "Desarrollo"
        }
      },
      "project_id": 1,
      "project": {
        "id": 1,
        "name": "Proyecto Alpha"
      },
      "created_at": "2024-11-15T10:30:00Z"
    }
  ]
}
```

### Obtener Estadísticas

```http
GET /activities/stats
Authorization: Bearer <token>
```

**Filtros:** Mismos que listar actividades

**Ejemplo:** `GET /activities/stats?month=2024-11&area_id=2`

**Respuesta exitosa:**

```json
{
  "success": true,
  "data": {
    "total_hours": 120.5,
    "total_activities": 45,
    "unique_users": 8,
    "average_hours_per_day": 4.2,
    "by_activity_type": {
      "plan_de_trabajo": {
        "count": 20,
        "hours": 60.0
      },
      "teams": {
        "count": 15,
        "hours": 40.5
      },
      "investigacion": {
        "count": 10,
        "hours": 20.0
      }
    },
    "by_area": {
      "Desarrollo": {
        "count": 30,
        "hours": 80.0
      },
      "Administración": {
        "count": 15,
        "hours": 40.5
      }
    }
  }
}
```

### Obtener Actividad por ID

```http
GET /activities/:id
Authorization: Bearer <token>
```

### Crear Actividad

```http
POST /activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2024-11-15",
  "hours": 3.5,
  "description": "Desarrollo de API",
  "activity_type": "plan_de_trabajo",
  "notes": "Implementación de endpoints",
  "project_id": 1
}
```

**Campos obligatorios:** `date`, `hours`, `description`, `activity_type`

**Tipos de actividad válidos:**

- `plan_de_trabajo`
- `apoyo_solicitado_por_otras_areas`
- `teams`
- `interno`
- `sesion`
- `investigacion`
- `prototipado`
- `disenos`
- `pruebas`
- `documentacion`

**Nota:** La actividad se crea automáticamente asignada al usuario autenticado.

### Actualizar Actividad

```http
PUT /activities/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "hours": 4.0,
  "description": "Desarrollo de API actualizado",
  "notes": "Agregué más funcionalidades"
}
```

**Permisos:** Solo el creador de la actividad

### Eliminar Actividad

```http
DELETE /activities/:id
Authorization: Bearer <token>
```

**Permisos:** Solo el creador de la actividad

---

## 📅 Calendario (Opcional)

**Requisitos:**

- Usuario autenticado (cualquier rol)
- Login con Microsoft OAuth
- Permisos de calendario configurados en Azure
- Access token de Microsoft con scope `Calendars.Read`

**Nota:** Cualquier usuario autenticado puede consultar SU propio calendario. No requiere permisos de admin.

### Obtener Eventos del Calendario

```http
POST /calendar/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "access_token": "EwBwA8l6BAAURSN/...",
  "start_date": "2024-12-01",
  "end_date": "2024-12-07"
}
```

**Campos opcionales:** Si no se envían `start_date` y `end_date`, retorna eventos de hoy.

**Respuesta exitosa:**

```json
{
  "success": true,
  "message": "Calendar events retrieved successfully",
  "data": [
    {
      "id": "AAMkAGI...",
      "subject": "Reunión de equipo",
      "description": "Revisión semanal del proyecto",
      "start_time": "2024-12-02T14:00:00Z",
      "end_time": "2024-12-02T15:00:00Z",
      "location": "Sala de conferencias",
      "is_online": true,
      "duration_hours": 1.0
    }
  ]
}
```

### Obtener Eventos de Hoy

```http
POST /calendar/today
Authorization: Bearer <token>
Content-Type: application/json

{
  "access_token": "EwBwA8l6BAAURSN/..."
}
```

**Respuesta:** Mismo formato que `/calendar/events`

**Errores:**

- `400` - Access token faltante
- `401` - Token de Microsoft inválido
- `403` - Permisos de calendario no otorgados

---

## ❌ Errores Comunes

### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid request: email is required"
}
```

**Causas:**

- Campos requeridos faltantes
- Formato de datos incorrecto
- Valores inválidos

### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**Causas:**

- Token JWT faltante o inválido
- Token expirado
- Credenciales incorrectas

### 403 Forbidden

```json
{
  "success": false,
  "message": "Access denied: insufficient permissions"
}
```

**Causas:**

- No tienes permisos para realizar la acción
- Intentas acceder a recursos de otra área (siendo Admin)

### 404 Not Found

```json
{
  "success": false,
  "message": "Resource not found"
}
```

**Causas:**

- El recurso no existe
- ID incorrecto

### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Internal server error"
}
```

**Causas:**

- Error en el servidor
- Error de base de datos
- Error al validar con servicios externos (Microsoft Graph API)

---

## 🧪 Testing

### cURL Examples

**Login Local:**

```powershell
curl -X POST http://localhost:8080/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@timeflow.com\",\"password\":\"admin123\"}'
```

**Crear Actividad:**

```powershell
curl -X POST http://localhost:8080/api/v1/activities `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{\"date\":\"2024-12-02\",\"hours\":3.5,\"description\":\"Testing API\",\"activity_type\":\"plan_de_trabajo\"}'
```

**Obtener Estadísticas:**

```powershell
curl -X GET "http://localhost:8080/api/v1/activities/stats?month=2024-12" `
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Postman Collection

Importa esta URL en Postman para obtener la colección completa:

```
http://localhost:8080/swagger/doc.json
```

---

## 🔒 Seguridad

### Headers Requeridos

Todas las rutas protegidas requieren:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Validaciones

1. **JWT válido**: Firma correcta y no expirado
2. **Usuario activo**: `is_active = true`
3. **Permisos por rol**: Verificación de permisos según rol
4. **Ownership**: Usuarios solo pueden modificar sus propios recursos

### Mejores Prácticas

- ✅ Siempre usar HTTPS en producción
- ✅ Regenerar JWT_SECRET en producción
- ✅ Configurar CORS apropiadamente
- ✅ No exponer información sensible en mensajes de error
- ✅ Validar todos los inputs del cliente

---

## 📚 Recursos Adicionales

- **Swagger UI**: http://localhost:8080/swagger/index.html
- **Documentación Frontend**: [FRONTEND.md](./FRONTEND.md)
- **Repositorio**: https://github.com/jaliko05/time-flow
