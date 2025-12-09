# 🔐 Guía: Gestión de Roles con Microsoft OAuth

## 📖 Resumen del Flujo

### Problema Original

Cuando un usuario iniciaba sesión con Microsoft, se creaba automáticamente con rol `user` y sin área asignada, sin posibilidad de que el SuperAdmin controlara los permisos.

### Solución Implementada

Ahora hay un **flujo de aprobación** donde:

1. Usuario inicia sesión con Microsoft → Se crea como "Pendiente"
2. SuperAdmin aprueba y configura rol + área
3. Usuario puede acceder con sus permisos asignados

---

## 🔄 Flujo Completo

### 1️⃣ Primer Inicio de Sesión con Microsoft

**Usuario hace login por primera vez:**

```mermaid
Usuario → Microsoft Login → Backend crea usuario con:
  - is_active: false (INACTIVO)
  - role: user (temporal)
  - area_id: null
  - auth_provider: "microsoft"
```

**Respuesta del backend:**

```json
{
  "status": "success",
  "message": "Account created. Waiting for administrator approval",
  "data": {
    "user": {
      "id": 15,
      "email": "nuevo.usuario@empresa.com",
      "full_name": "Nuevo Usuario",
      "role": "user",
      "is_active": false
    },
    "pending_approval": true
  }
}
```

**El usuario ve un mensaje:**

> "Tu cuenta ha sido creada. Un administrador debe aprobarla antes de que puedas acceder al sistema."

---

### 2️⃣ SuperAdmin Aprueba el Usuario

**SuperAdmin accede al panel:**

1. **Dashboard SuperAdmin** → Pestaña "Usuarios"
2. Ve una **alerta naranja** con usuarios pendientes
3. Hace clic en "Aprobar y Configurar"

**Configuración del usuario:**

```
┌─────────────────────────────────────────┐
│ Configurar Usuario                      │
├─────────────────────────────────────────┤
│ Nuevo Usuario (nuevo.usuario@empresa.com)│
│                                         │
│ Proveedor: [Microsoft OAuth]            │
│                                         │
│ Rol: [Seleccionar]                      │
│   ○ Usuario                             │
│   ○ Admin de Área                       │
│   ○ Super Admin                         │
│                                         │
│ Área: [Seleccionar área] *              │
│   - Desarrollo                          │
│   - Marketing                           │
│   - Ventas                              │
│                                         │
│ Estado: [○ Activo] ← DEBE ACTIVAR       │
│                                         │
│ [Cancelar] [Guardar Cambios]           │
└─────────────────────────────────────────┘
```

**El SuperAdmin debe:**

- ✅ Seleccionar ROL apropiado
- ✅ Asignar ÁREA (obligatorio si es Admin de Área)
- ✅ ACTIVAR el usuario (toggle a ON)

---

### 3️⃣ Usuario Inicia Sesión (Ya Aprobado)

**Segunda vez que inicia sesión:**

```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 15,
      "email": "nuevo.usuario@empresa.com",
      "full_name": "Nuevo Usuario",
      "role": "admin_area",
      "area_id": 3,
      "area": {
        "id": 3,
        "name": "Desarrollo"
      },
      "is_active": true,
      "auth_provider": "microsoft"
    }
  }
}
```

**Ahora el usuario puede:**

- ✅ Acceder al dashboard
- ✅ Ver/crear recursos según su rol
- ✅ Gestionar su área (si es Admin de Área)

---

## 👥 Gestión de Áreas

### Crear Nueva Área

**SuperAdmin → Dashboard → Pestaña "Áreas" → "Nueva Área"**

```
┌─────────────────────────────────────────┐
│ Nueva Área                              │
├─────────────────────────────────────────┤
│ Nombre: [Marketing Digital]             │
│                                         │
│ Descripción:                            │
│ ┌─────────────────────────────────────┐ │
│ │ Área encargada de campañas          │ │
│ │ digitales, redes sociales y SEO     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Cancelar] [Crear Área]                │
└─────────────────────────────────────────┘
```

**Backend valida:**

- ✅ Nombre único
- ✅ Solo SuperAdmin puede crear

### Editar/Desactivar Área

**Desde la tabla de áreas:**

| Nombre          | Descripción    | Usuarios | Estado      | Acciones |
| --------------- | -------------- | -------- | ----------- | -------- |
| Desarrollo      | Equipo de devs | 👥 8     | ✅ Activa   | ✏️       |
| Marketing       | Publicidad     | 👥 5     | ✅ Activa   | ✏️       |
| Ventas Antiguas | Cerrada        | 👥 0     | ❌ Inactiva | ✏️       |

**Toggle de estado:**

- ON → Área activa (usuarios pueden trabajar)
- OFF → Área inactiva (bloquea operaciones)

---

## 🎭 Permisos por Rol

### Super Admin

```yaml
Puede:
  - ✅ Ver todos los usuarios
  - ✅ Aprobar usuarios de Microsoft
  - ✅ Cambiar roles de cualquier usuario
  - ✅ Crear/editar/desactivar áreas
  - ✅ Ver estadísticas globales
  - ✅ Acceder a todas las áreas
  - ✅ Gestionar todos los proyectos/tareas
```

### Admin de Área

```yaml
Puede:
  - ✅ Ver usuarios de SU área
  - ✅ Crear/editar usuarios de SU área
  - ✅ Crear proyectos en SU área
  - ✅ Asignar tareas a usuarios de SU área
  - ✅ Ver estadísticas de SU área

NO puede:
  - ❌ Aprobar usuarios de Microsoft (solo SuperAdmin)
  - ❌ Crear/editar áreas
  - ❌ Cambiar su propio rol
  - ❌ Ver otras áreas
```

### Usuario

```yaml
Puede:
  - ✅ Ver sus tareas asignadas
  - ✅ Registrar actividades
  - ✅ Ver proyectos de SU área
  - ✅ Actualizar estado de SUS tareas

NO puede:
  - ❌ Crear usuarios
  - ❌ Asignar tareas
  - ❌ Ver otras áreas
  - ❌ Gestionar proyectos
```

---

## 🛠️ Casos de Uso Comunes

### Caso 1: Nuevo Empleado se une

```bash
# 1. Empleado inicia sesión con Microsoft
POST /api/v1/auth/microsoft
{
  "access_token": "..."
}

# Respuesta: pending_approval: true

# 2. SuperAdmin entra al dashboard
GET /dashboard → Pestaña "Usuarios"
# Ve alerta: "1 usuario pendiente"

# 3. SuperAdmin configura:
PATCH /api/v1/users/15
{
  "role": "user",
  "area_id": 3,
  "is_active": true
}

# 4. Empleado inicia sesión nuevamente
POST /api/v1/auth/microsoft
# Ahora obtiene token y acceso completo
```

### Caso 2: Crear Nueva Área para Departamento

```bash
# 1. SuperAdmin → Dashboard → Áreas → Nueva Área
POST /api/v1/areas
{
  "name": "Recursos Humanos",
  "description": "Gestión de personal y cultura"
}

# 2. Aparece en el selector de áreas
# 3. Puede asignar usuarios a "Recursos Humanos"
```

### Caso 3: Promover Usuario a Admin de Área

```bash
# SuperAdmin edita usuario existente
PATCH /api/v1/users/8
{
  "role": "admin_area",
  "area_id": 2  # OBLIGATORIO para admin_area
}

# Validación backend:
if (role === "admin_area" && !area_id) {
  return error("Admin de Área debe tener área asignada")
}
```

### Caso 4: Desactivar Usuario Temporalmente

```bash
# SuperAdmin o Admin de Área
PATCH /api/v1/users/12
{
  "is_active": false
}

# Usuario ya no puede iniciar sesión
# Se muestra: "User account is inactive"
```

---

## 📊 Vistas del Panel SuperAdmin

### Pestaña "Resumen"

- Estadísticas globales (usuarios, proyectos, horas)
- Gráficos por área
- Top 10 usuarios más activos

### Pestaña "Usuarios"

Tiene 3 secciones automáticas:

**1. Usuarios Pendientes (Naranja)**

```
┌─────────────────────────────────────────────────┐
│ ⏰ Usuarios Pendientes de Aprobación            │
│ 2 usuarios de Microsoft esperando activación   │
├─────────────────────────────────────────────────┤
│ Juan Pérez | juan@empresa.com | Microsoft       │
│                    [✓ Aprobar y Configurar]    │
│                                                 │
│ Ana López | ana@empresa.com | Microsoft         │
│                    [✓ Aprobar y Configurar]    │
└─────────────────────────────────────────────────┘
```

**2. Usuarios Activos (Verde)**

```
┌─────────────────────────────────────────────────┐
│ Usuarios Activos                                │
│ 15 usuarios activos                            │
├─────────────────────────────────────────────────┤
│ Usuario | Email | Rol | Área | Estado | Editar │
│ ...tabla con todos los usuarios...             │
└─────────────────────────────────────────────────┘
```

**3. Usuarios Inactivos (Gris)**

```
┌─────────────────────────────────────────────────┐
│ 👤 Usuarios Inactivos                           │
│ 3 usuarios desactivados                        │
├─────────────────────────────────────────────────┤
│ Ex-empleados o cuentas temporalmente bloqueadas│
│                          [Reactivar]           │
└─────────────────────────────────────────────────┘
```

### Pestaña "Áreas"

```
┌─────────────────────────────────────────────────┐
│ Gestión de Áreas                [+ Nueva Área] │
├─────────────────────────────────────────────────┤
│ Nombre | Descripción | Usuarios | Estado        │
│ Desarrollo | ... | 👥 8 | [✓] Activa | ✏️      │
│ Marketing | ... | 👥 5 | [✓] Activa | ✏️       │
└─────────────────────────────────────────────────┘
```

---

## ⚠️ Validaciones Importantes

### Backend (`handlers/auth.go`)

```go
// Nuevos usuarios de Microsoft → INACTIVOS
user = models.User{
    Email:        msUserInfo.Mail,
    FullName:     fullName,
    Role:         models.RoleUser,
    IsActive:     false,  // ← PENDIENTE
    AuthProvider: "microsoft",
}

// Retorna código 202 (Accepted)
utils.SuccessResponse(c, 202, "Account created. Waiting for administrator approval", ...)
```

### Frontend (`components/admin/UserManagement.jsx`)

```jsx
// Validación antes de guardar
if (formData.role === "admin_area" && !formData.area_id) {
  toast({
    title: "Error de validación",
    description: "Un Admin de Área debe tener un área asignada",
    variant: "destructive",
  });
  return;
}
```

### API (`handlers/users.go`)

```go
// Admin solo ve usuarios de su área
if userRole == models.RoleAdmin {
    query = query.Where("area_id = ?", userAreaID)
}

// SuperAdmin ve todos
if userRole == models.RoleSuperAdmin {
    // Sin restricciones
}
```

---

## 🧪 Testing

### Test 1: Usuario Microsoft Nuevo

```powershell
# Login con token de Microsoft
$response = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8080/api/v1/auth/microsoft" `
  -Body (@{access_token="MOCK_TOKEN"} | ConvertTo-Json) `
  -ContentType "application/json"

# Debe retornar:
# status: 202
# pending_approval: true
# is_active: false
```

### Test 2: SuperAdmin Aprueba

```powershell
# Login como SuperAdmin
$token = "eyJ..."

# Aprobar usuario
Invoke-RestMethod -Method PATCH `
  -Uri "http://localhost:8080/api/v1/users/15" `
  -Headers @{Authorization="Bearer $token"} `
  -Body (@{
    role="admin_area"
    area_id=3
    is_active=$true
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

### Test 3: Crear Área

```powershell
# Solo SuperAdmin
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8080/api/v1/areas" `
  -Headers @{Authorization="Bearer $superAdminToken"} `
  -Body (@{
    name="Data Science"
    description="Análisis de datos e IA"
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

---

## 📝 Notas Finales

### Diferencias con Usuarios Locales

| Aspecto            | Microsoft OAuth     | Local (Email/Password) |
| ------------------ | ------------------- | ---------------------- |
| **Creación**       | Automática al login | Manual por admin       |
| **Estado inicial** | `is_active: false`  | `is_active: true`      |
| **Password**       | No tiene (NULL)     | Requerido              |
| **Aprobación**     | Requiere SuperAdmin | Ya activado            |
| **Provider**       | "microsoft"         | "local"                |

### Mejores Prácticas

1. **Revisar usuarios pendientes diariamente**

   - SuperAdmin debe entrar a "Usuarios" y aprobar nuevos

2. **Asignar áreas correctamente**

   - Admin de Área SIEMPRE necesita área
   - Usuario y SuperAdmin es opcional

3. **Crear áreas antes de asignar**

   - Tener áreas listas para nuevos empleados

4. **Documentar roles en onboarding**
   - Explicar a nuevos usuarios que deben esperar aprobación

---

**Última actualización:** Diciembre 2024  
**Versión:** 1.0
