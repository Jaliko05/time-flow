# 🔧 Troubleshooting: Crear Proyecto Personal

## Problema Reportado

Usuario no puede crear proyectos personales desde el dashboard.

## Pasos para Diagnosticar

### 1. Verificar en el Navegador (Frontend)

Abre la consola del navegador (F12) y busca:

```javascript
// Al hacer clic en "Guardar" debe aparecer:
Enviando proyecto: {
  name: "Mi Proyecto",
  description: "...",
  project_type: "personal",
  assigned_user_id: null,
  estimated_hours: 8
}

// Si hay error:
Error al crear proyecto: {...}
Response data: {...}
```

**Posibles errores:**

#### Error 400 - Validación fallida

```json
{
  "message": "Key: 'CreateProjectRequest.ProjectType' Error:Field validation for 'ProjectType' failed on the 'oneof' tag"
}
```

**Solución:** El backend espera `project_type` pero quizás se está enviando otro valor.

#### Error 403 - Permisos denegados

```json
{
  "message": "Only admins can create area projects"
}
```

**Solución:** Verificar que `project_type` sea exactamente `"personal"`.

#### Error 401 - No autenticado

```json
{
  "message": "Unauthorized"
}
```

**Solución:** El token JWT expiró o no es válido. Cerrar sesión y volver a iniciar.

### 2. Verificar en el Backend

Si el backend está corriendo, verás logs como:

```bash
# Request recibido
[GIN] 2024/12/09 - 14:23:45 | 201 |    45.2ms |  127.0.0.1 | POST     "/api/v1/projects"

# Si hay error de validación
[GIN] 2024/12/09 - 14:23:45 | 400 |     2.1ms |  127.0.0.1 | POST     "/api/v1/projects"
```

### 3. Verificar Datos del Usuario

En el dashboard de usuario, verifica:

```javascript
// El usuario debe tener estructura correcta
user = {
  id: 5,
  email: "usuario@empresa.com",
  role: "user", // ← Debe ser exactamente "user"
  area_id: 2,
  is_active: true,
};
```

### 4. Prueba Manual con cURL

Prueba directamente la API:

```powershell
# 1. Login (obtener token)
$loginResponse = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8080/api/v1/auth/login" `
  -Body (@{
    email="usuario@empresa.com"
    password="password123"
  } | ConvertTo-Json) `
  -ContentType "application/json"

$token = $loginResponse.data.token

# 2. Crear proyecto personal
$project = Invoke-RestMethod -Method POST `
  -Uri "http://localhost:8080/api/v1/projects" `
  -Headers @{Authorization="Bearer $token"} `
  -Body (@{
    name="Mi Proyecto Personal"
    description="Proyecto de prueba"
    project_type="personal"
    estimated_hours=10
  } | ConvertTo-Json) `
  -ContentType "application/json"

Write-Host "Proyecto creado:" -ForegroundColor Green
$project | ConvertTo-Json -Depth 3
```

**Respuesta esperada:**

```json
{
  "status": "success",
  "message": "Project created successfully",
  "data": {
    "id": 15,
    "name": "Mi Proyecto Personal",
    "project_type": "personal",
    "created_by": 5,
    "status": "in_progress",
    "estimated_hours": 10,
    "used_hours": 0,
    "remaining_hours": 10
  }
}
```

## Soluciones Comunes

### Fix 1: Verificar que project_type se envíe correctamente

En `UserDashboard.jsx` línea ~175:

```jsx
createProjectMutation.mutate({
  ...data,
  project_type: "personal", // ← Asegurarse que sea exactamente así
});
```

### Fix 2: Verificar que el usuario tenga área asignada

Aunque los proyectos personales no requieren área, el usuario DEBE tener `area_id` para otros permisos:

```sql
-- Verificar en PostgreSQL
SELECT id, email, role, area_id, is_active FROM users WHERE id = 5;
```

Si `area_id` es `NULL`, asignar un área:

```sql
UPDATE users SET area_id = 1 WHERE id = 5;
```

### Fix 3: Verificar que estimated_hours sea válido

El backend requiere `estimated_hours > 0`:

```javascript
// En el formulario, asegurarse de enviar número válido
estimated_hours: parseFloat(formData.estimated_hours) || 8;
```

### Fix 4: Verificar estado de autenticación

```javascript
// En AuthContext, verificar que el token esté presente
localStorage.getItem("token"); // Debe retornar un string largo

// Si no hay token, hacer logout y login nuevamente
```

## Checklist de Verificación

- [ ] Usuario tiene `role: "user"` correcto
- [ ] Usuario tiene `is_active: true`
- [ ] Usuario tiene `area_id` asignada (no null)
- [ ] Token JWT es válido y no ha expirado
- [ ] El campo `project_type` es exactamente `"personal"`
- [ ] El campo `estimated_hours` es un número > 0
- [ ] El backend está corriendo en `localhost:8080`
- [ ] No hay errores de CORS en la consola

## Debugging Avanzado

### Ver request completo en Network Tab

1. Abrir DevTools (F12)
2. Ir a pestaña "Network"
3. Crear proyecto
4. Buscar request `POST projects`
5. Ver "Headers" → "Request Payload"

**Debe verse así:**

```json
{
  "name": "Mi Proyecto",
  "description": "",
  "project_type": "personal",
  "assigned_user_id": null,
  "estimated_hours": 8
}
```

### Ver response del backend

En el mismo request, ver "Response":

```json
{
  "status": "success",
  "message": "Project created successfully",
  "data": { ... }
}
```

O si hay error:

```json
{
  "status": "error",
  "message": "Only admins can create area projects",
  "data": null
}
```

---

## Solución Aplicada

He agregado logs de debugging en `UserDashboard.jsx`:

```javascript
const createProjectMutation = useMutation({
  mutationFn: (data) => {
    console.log("Enviando proyecto:", data); // ← Ver qué se envía
    return projectsAPI.create(data);
  },
  onSuccess: (result) => {
    console.log("Proyecto creado:", result); // ← Ver respuesta exitosa
    // ...
  },
  onError: (error) => {
    console.error("Error al crear proyecto:", error); // ← Ver error completo
    console.error("Response data:", error.response?.data); // ← Ver mensaje del backend
    // ...
  },
});
```

**Próximos pasos:**

1. Intenta crear el proyecto nuevamente
2. Abre la consola del navegador (F12)
3. Copia y pega los logs que aparezcan
4. Con eso sabré exactamente qué está fallando

---

**Última actualización:** Diciembre 2024
