# 🧪 Comandos de Testing - Time Flow

## 📝 Variables de Entorno para Tests

```powershell
# Token de autenticación (obtener después de login)
$TOKEN = "tu_jwt_token_aqui"

# Headers comunes
$HEADERS = @{
    "Authorization" = "Bearer $TOKEN"
    "Content-Type" = "application/json"
}

$BASE_URL = "http://localhost:8080/api/v1"
```

## 🔐 Autenticación

### Login Tradicional

```powershell
$loginData = @{
    email = "admin@timeflow.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginData -ContentType "application/json"
$TOKEN = $response.data.token
Write-Host "Token: $TOKEN"
```

### Obtener Usuario Actual

```powershell
$me = Invoke-RestMethod -Uri "$BASE_URL/auth/me" -Headers $HEADERS
Write-Host "Usuario: $($me.data.full_name) - Rol: $($me.data.role)"
```

## 🏢 Áreas

### Listar Áreas

```powershell
$areas = Invoke-RestMethod -Uri "$BASE_URL/areas" -Headers $HEADERS
$areas.data | Format-Table id, name, is_active
```

### Crear Área (SuperAdmin only)

```powershell
$areaData = @{
    name = "Desarrollo"
    description = "Área de desarrollo de software"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/areas" -Method Post -Headers $HEADERS -Body $areaData
```

## 👥 Usuarios

### Listar Usuarios

```powershell
$users = Invoke-RestMethod -Uri "$BASE_URL/users" -Headers $HEADERS
$users.data | Format-Table id, full_name, email, role, area_id
```

### Crear Usuario (Admin/SuperAdmin)

```powershell
$userData = @{
    email = "juan.perez@empresa.com"
    password = "password123"
    full_name = "Juan Pérez"
    role = "user"
    area_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/users" -Method Post -Headers $HEADERS -Body $userData
```

## 📁 Proyectos

### Listar Proyectos

```powershell
$projects = Invoke-RestMethod -Uri "$BASE_URL/projects" -Headers $HEADERS
$projects.data | Format-Table id, name, status, project_type, estimated_hours, used_hours
```

### Crear Proyecto Personal

```powershell
$projectData = @{
    name = "Migración a Microservicios"
    description = "Migrar aplicación monolítica a arquitectura de microservicios"
    project_type = "personal"
    estimated_hours = 120
} | ConvertTo-Json

$newProject = Invoke-RestMethod -Uri "$BASE_URL/projects" -Method Post -Headers $HEADERS -Body $projectData
Write-Host "Proyecto creado con ID: $($newProject.data.id)"
```

### Crear Proyecto de Área (Admin)

```powershell
$areaProjectData = @{
    name = "Sistema de Inventario"
    description = "Desarrollo de sistema de inventario"
    project_type = "area"
    assigned_user_id = 2
    estimated_hours = 200
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/projects" -Method Post -Headers $HEADERS -Body $areaProjectData
```

### Obtener Detalle de Proyecto

```powershell
$projectId = 1
$project = Invoke-RestMethod -Uri "$BASE_URL/projects/$projectId" -Headers $HEADERS
$project.data | Format-List
```

### Cambiar Estado de Proyecto

```powershell
$projectId = 1
$statusData = @{
    status = "in_progress"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/projects/$projectId/status" -Method Patch -Headers $HEADERS -Body $statusData
```

## ✅ Tareas

### Listar Tareas

```powershell
$tasks = Invoke-RestMethod -Uri "$BASE_URL/tasks" -Headers $HEADERS
$tasks.data | Format-Table id, name, status, priority, estimated_hours, used_hours
```

### Listar Tareas de un Proyecto

```powershell
$projectId = 1
$tasks = Invoke-RestMethod -Uri "$BASE_URL/tasks?project_id=$projectId" -Headers $HEADERS
$tasks.data | Format-Table id, name, status, assigned_user_id
```

### Crear Tarea

```powershell
$taskData = @{
    project_id = 1
    name = "Diseñar base de datos"
    description = "Diseñar esquema de base de datos para módulo de inventario"
    priority = "high"
    estimated_hours = 8
    assigned_user_id = 2
    due_date = "2024-12-31"
} | ConvertTo-Json

$newTask = Invoke-RestMethod -Uri "$BASE_URL/tasks" -Method Post -Headers $HEADERS -Body $taskData
Write-Host "Tarea creada con ID: $($newTask.data.id)"
```

### Obtener Detalle de Tarea

```powershell
$taskId = 1
$task = Invoke-RestMethod -Uri "$BASE_URL/tasks/$taskId" -Headers $HEADERS
$task.data | Format-List
```

### Cambiar Estado de Tarea

```powershell
$taskId = 1
$statusData = @{
    status = "in_progress"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/tasks/$taskId/status" -Method Patch -Headers $HEADERS -Body $statusData
```

### Actualizar Tarea

```powershell
$taskId = 1
$updateData = @{
    name = "Diseñar y documentar base de datos"
    estimated_hours = 12
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/tasks/$taskId" -Method Put -Headers $HEADERS -Body $updateData
```

### Reordenar Tareas (Bulk Update)

```powershell
$orderData = @{
    tasks = @(
        @{ id = 1; order = 0 },
        @{ id = 2; order = 1 },
        @{ id = 3; order = 2 }
    )
} | ConvertTo-Json -Depth 3

Invoke-RestMethod -Uri "$BASE_URL/tasks/bulk-order" -Method Patch -Headers $HEADERS -Body $orderData
```

## 📝 Actividades

### Listar Actividades

```powershell
$activities = Invoke-RestMethod -Uri "$BASE_URL/activities" -Headers $HEADERS
$activities.data | Format-Table id, activity_name, execution_time, date, project_name, task_name
```

### Listar Actividades de Hoy

```powershell
$today = Get-Date -Format "yyyy-MM-dd"
$activities = Invoke-RestMethod -Uri "$BASE_URL/activities?date=$today" -Headers $HEADERS
$activities.data | Format-Table activity_name, execution_time, project_name
```

### Crear Actividad Simple

```powershell
$activityData = @{
    activity_name = "Reunión de planificación"
    activity_type = "sesion"
    execution_time = 2
    date = (Get-Date -Format "yyyy-MM-dd")
    observations = "Planificación del sprint 2024-12"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/activities" -Method Post -Headers $HEADERS -Body $activityData
```

### Crear Actividad Vinculada a Proyecto

```powershell
$activityData = @{
    project_id = 1
    project_name = "Sistema de Inventario"
    activity_name = "Desarrollo de API REST"
    activity_type = "plan_de_trabajo"
    execution_time = 4.5
    date = (Get-Date -Format "yyyy-MM-dd")
    observations = "Implementación de endpoints CRUD de productos"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$BASE_URL/activities" -Method Post -Headers $HEADERS -Body $activityData
```

### Crear Actividad Vinculada a Tarea

```powershell
$activityData = @{
    project_id = 1
    task_id = 1
    task_name = "Diseñar base de datos"
    activity_name = "Diseño de tablas"
    activity_type = "plan_de_trabajo"
    execution_time = 3
    date = (Get-Date -Format "yyyy-MM-dd")
    observations = "Diseño de tablas productos, categorías y proveedores"
} | ConvertTo-Json

$activity = Invoke-RestMethod -Uri "$BASE_URL/activities" -Method Post -Headers $HEADERS -Body $activityData
Write-Host "Actividad registrada - Tarea actualizada automáticamente"
```

### Obtener Estadísticas de Actividades

```powershell
# Estadísticas del mes actual
$month = Get-Date -Format "yyyy-MM"
$stats = Invoke-RestMethod -Uri "$BASE_URL/activities/stats?month=$month" -Headers $HEADERS
$stats.data | Format-List

# Estadísticas por rango de fechas
$dateFrom = "2024-12-01"
$dateTo = "2024-12-31"
$stats = Invoke-RestMethod -Uri "$BASE_URL/activities/stats?date_from=$dateFrom&date_to=$dateTo" -Headers $HEADERS
$stats.data | Format-List
```

## 📊 Estadísticas (Admin/SuperAdmin)

### Resumen de Áreas

```powershell
$summary = Invoke-RestMethod -Uri "$BASE_URL/stats/areas" -Headers $HEADERS
$summary.data | Format-Table
```

### Resumen de Usuarios

```powershell
$summary = Invoke-RestMethod -Uri "$BASE_URL/stats/users" -Headers $HEADERS
$summary.data | Format-Table
```

### Resumen de Proyectos

```powershell
$summary = Invoke-RestMethod -Uri "$BASE_URL/stats/projects" -Headers $HEADERS
$summary.data | Format-Table
```

## 📅 Calendario

### Obtener Eventos del Día

```powershell
$events = Invoke-RestMethod -Uri "$BASE_URL/calendar/today" -Headers $HEADERS
$events.data | Format-Table subject, start, end, duration
```

### Obtener Eventos por Rango

```powershell
$calendarData = @{
    start_date = (Get-Date).ToString("yyyy-MM-dd")
    end_date = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
} | ConvertTo-Json

$events = Invoke-RestMethod -Uri "$BASE_URL/calendar/events" -Method Post -Headers $HEADERS -Body $calendarData
$events.data | Format-Table
```

## 🧪 Escenarios de Prueba Completos

### Escenario 1: Flujo Completo de Proyecto

```powershell
# 1. Login como Admin
$loginData = @{ email = "admin@area.com"; password = "password123" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginData -ContentType "application/json"
$TOKEN = $response.data.token
$HEADERS = @{ "Authorization" = "Bearer $TOKEN"; "Content-Type" = "application/json" }

# 2. Crear Proyecto
$projectData = @{
    name = "Proyecto de Prueba"
    project_type = "area"
    assigned_user_id = 2
    estimated_hours = 40
} | ConvertTo-Json
$project = Invoke-RestMethod -Uri "$BASE_URL/projects" -Method Post -Headers $HEADERS -Body $projectData

# 3. Crear Tareas
$task1Data = @{
    project_id = $project.data.id
    name = "Tarea 1"
    priority = "high"
    estimated_hours = 8
    assigned_user_id = 2
} | ConvertTo-Json
$task1 = Invoke-RestMethod -Uri "$BASE_URL/tasks" -Method Post -Headers $HEADERS -Body $task1Data

# 4. Cambiar estado a in_progress
$statusData = @{ status = "in_progress" } | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE_URL/projects/$($project.data.id)/status" -Method Patch -Headers $HEADERS -Body $statusData
Invoke-RestMethod -Uri "$BASE_URL/tasks/$($task1.data.id)/status" -Method Patch -Headers $HEADERS -Body $statusData

# 5. Registrar Actividad
$activityData = @{
    project_id = $project.data.id
    task_id = $task1.data.id
    activity_name = "Desarrollo inicial"
    activity_type = "plan_de_trabajo"
    execution_time = 2.5
    date = (Get-Date -Format "yyyy-MM-dd")
    observations = "Primera sesión de desarrollo"
} | ConvertTo-Json
Invoke-RestMethod -Uri "$BASE_URL/activities" -Method Post -Headers $HEADERS -Body $activityData

# 6. Verificar actualización de horas
$updatedTask = Invoke-RestMethod -Uri "$BASE_URL/tasks/$($task1.data.id)" -Headers $HEADERS
Write-Host "Horas usadas en tarea: $($updatedTask.data.used_hours) / $($updatedTask.data.estimated_hours)"

$updatedProject = Invoke-RestMethod -Uri "$BASE_URL/projects/$($project.data.id)" -Headers $HEADERS
Write-Host "Horas usadas en proyecto: $($updatedProject.data.used_hours) / $($updatedProject.data.estimated_hours)"
Write-Host "Progreso: $($updatedProject.data.completion_percent)%"
```

### Escenario 2: Validación de Permisos

```powershell
# Login como Usuario
$loginData = @{ email = "usuario@area.com"; password = "password123" } | ConvertTo-Json
$response = Invoke-RestMethod -Uri "$BASE_URL/auth/login" -Method Post -Body $loginData -ContentType "application/json"
$USER_TOKEN = $response.data.token
$USER_HEADERS = @{ "Authorization" = "Bearer $USER_TOKEN"; "Content-Type" = "application/json" }

# Intentar crear tarea (debe fallar)
try {
    $taskData = @{
        project_id = 1
        name = "Tarea no autorizada"
        priority = "low"
        estimated_hours = 1
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BASE_URL/tasks" -Method Post -Headers $USER_HEADERS -Body $taskData
    Write-Host "ERROR: El usuario no debería poder crear tareas"
} catch {
    Write-Host "✓ Correcto: Usuario no tiene permisos para crear tareas"
}

# Ver solo sus tareas asignadas (debe funcionar)
$myTasks = Invoke-RestMethod -Uri "$BASE_URL/tasks" -Headers $USER_HEADERS
Write-Host "✓ Usuario puede ver sus tareas: $($myTasks.data.Count) tareas"
```

## 🔍 Verificación de Base de Datos

### Verificar estructura de tablas

```sql
-- Conectar a PostgreSQL
psql -U postgres -d timeflow

-- Listar tablas
\dt

-- Ver estructura de tasks
\d tasks

-- Contar registros
SELECT
    'users' as tabla, COUNT(*) as registros FROM users
UNION ALL
SELECT 'areas', COUNT(*) FROM areas
UNION ALL
SELECT 'projects', COUNT(*) FROM projects
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks
UNION ALL
SELECT 'activities', COUNT(*) FROM activities;

-- Ver tareas con sus proyectos
SELECT
    t.id,
    t.name as tarea,
    t.status,
    p.name as proyecto,
    u.full_name as asignado_a
FROM tasks t
JOIN projects p ON t.project_id = p.id
LEFT JOIN users u ON t.assigned_user_id = u.id;

-- Ver actividades con tareas y proyectos
SELECT
    a.id,
    a.activity_name,
    a.execution_time,
    p.name as proyecto,
    t.name as tarea
FROM activities a
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN tasks t ON a.task_id = t.id
ORDER BY a.created_at DESC
LIMIT 10;
```

## 📈 Métricas y Performance

### Tiempo de respuesta de endpoints

```powershell
Measure-Command {
    Invoke-RestMethod -Uri "$BASE_URL/projects" -Headers $HEADERS
} | Select-Object TotalMilliseconds

Measure-Command {
    Invoke-RestMethod -Uri "$BASE_URL/tasks" -Headers $HEADERS
} | Select-Object TotalMilliseconds
```

### Verificar índices en base de datos

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('tasks', 'activities', 'projects')
ORDER BY tablename, indexname;
```

---

**Nota**: Reemplazar los valores de ejemplo (IDs, emails, etc.) con los valores reales de tu sistema.

**Tip**: Guardar el token JWT en una variable de sesión para no tener que hacer login cada vez:

```powershell
$TOKEN = "tu_token_aqui"
```
