# Sistema de Asignaciones Múltiples - Proyectos y Tareas

## 🎯 Nuevas Funcionalidades

### 1. **Asignación Opcional al Crear Proyecto**

Ya NO es obligatorio asignar un usuario al crear un proyecto de área. La asignación puede hacerse después.

### 2. **Múltiples Usuarios por Proyecto/Tarea**

Ahora un proyecto o tarea puede tener **múltiples usuarios asignados** simultáneamente.

### 3. **Permisos Granulares**

- **Asignación a Proyecto Completo**: Usuario puede modificar cualquier tarea del proyecto
- **Asignación a Tarea Específica**: Usuario solo puede modificar esa tarea (pero ve todo el proyecto)

---

## 📊 Nuevos Modelos de Base de Datos

### ProjectAssignment (project_assignments)

Tabla intermedia para asignaciones de proyectos:

```go
type ProjectAssignment struct {
    ID           uint
    ProjectID    uint        // ID del proyecto
    UserID       uint        // ID del usuario asignado
    AssignedBy   uint        // Quién lo asignó
    AssignedAt   time.Time   // Cuándo fue asignado
    CanModify    bool        // Puede modificar todo el proyecto
    IsActive     bool        // Asignación activa
    UnassignedAt *time.Time  // Cuándo se desasignó
}
```

### TaskAssignment (task_assignments)

Tabla intermedia para asignaciones de tareas:

```go
type TaskAssignment struct {
    ID           uint
    TaskID       uint        // ID de la tarea
    UserID       uint        // ID del usuario asignado
    AssignedBy   uint        // Quién lo asignó
    AssignedAt   time.Time   // Cuándo fue asignado
    CanModify    bool        // Puede modificar esta tarea
    IsActive     bool        // Asignación activa
    UnassignedAt *time.Time  // Cuándo se desasignó
}
```

---

## 🔄 Relaciones Many-to-Many

### Proyecto → Usuarios

```go
// En el modelo Project
AssignedUsers []User `gorm:"many2many:project_assignments"`
ProjectAssignments []ProjectAssignment `gorm:"foreignKey:ProjectID"`
```

### Tarea → Usuarios

```go
// En el modelo Task
AssignedUsers []User `gorm:"many2many:task_assignments"`
TaskAssignments []TaskAssignment `gorm:"foreignKey:TaskID"`
```

---

## 🎨 Cambios en el Frontend

### ProjectFormDialog.jsx

**Antes:**

- ❌ Asignación obligatoria para proyectos de área
- ❌ Solo un usuario

**Ahora:**

- ✅ Asignación opcional (se puede hacer después)
- ✅ Placeholder: "Sin asignar (se puede asignar después)"
- ✅ Opción "Sin asignar" en el select
- ✅ Texto informativo: "Podrás asignar múltiples usuarios más adelante"

---

## 🔧 Cambios en el Backend

### handlers/projects.go

**CreateProject:**

```go
// Antes: Validaba que tuviera assigned_user_id
if formData.project_type === "area" && !formData.assigned_user_id {
    return error
}

// Ahora: Asignación opcional
// Assignment can be done later via separate endpoint
```

---

## 📋 Nuevas Tablas Creadas Automáticamente

Al iniciar el servidor, GORM crea automáticamente:

1. ✅ `project_assignments` - Asignaciones de proyectos
2. ✅ `task_assignments` - Asignaciones de tareas

Con índices en:

- `project_id`
- `user_id`
- `task_id`

---

## 🚀 Flujo de Trabajo

### Crear Proyecto de Área

```
1. Admin crea proyecto sin asignar
   ↓
2. Proyecto queda en estado "unassigned"
   ↓
3. Admin puede asignar usuarios después
   ↓
4. Cada usuario asignado puede:
   - Ver todo el proyecto
   - Modificar según permisos (can_modify)
```

### Asignar a Proyecto Completo

```
POST /api/v1/projects/{id}/assignments
{
  "user_ids": [5, 7, 12],
  "can_modify": true  // ← Puede modificar todo
}
```

### Asignar a Tarea Específica

```
POST /api/v1/tasks/{id}/assignments
{
  "user_ids": [5],
  "can_modify": true  // ← Solo esta tarea
}
```

---

## 🔐 Lógica de Permisos

### Usuario Asignado a Proyecto

```
✅ Ver todas las tareas del proyecto
✅ Modificar cualquier tarea (si can_modify=true)
✅ Crear nuevas tareas en el proyecto
✅ Ver actividades de otros usuarios
```

### Usuario Asignado a Tarea

```
✅ Ver todo el proyecto (contexto)
✅ Ver todas las tareas (solo lectura)
✅ Modificar SOLO la tarea asignada (si can_modify=true)
❌ NO puede modificar otras tareas
❌ NO puede crear tareas nuevas
```

---

## 📊 Queries Optimizadas

### Obtener Proyectos del Usuario

```go
// Legacy (campo AssignedUserID)
query.Where("assigned_user_id = ?", userID)

// Nuevo (many-to-many)
query.Joins("LEFT JOIN project_assignments ON projects.id = project_assignments.project_id").
     Where("project_assignments.user_id = ? AND project_assignments.is_active = ?", userID, true)
```

### Obtener Usuarios Asignados a Proyecto

```go
var project models.Project
DB.Preload("AssignedUsers").
   Preload("ProjectAssignments").
   First(&project, projectID)
```

---

## 🔍 Verificar Permisos

### Middleware para Verificar Acceso

```go
func CanModifyProject(userID, projectID uint) bool {
    var assignment models.ProjectAssignment
    err := DB.Where("user_id = ? AND project_id = ? AND is_active = ?",
                    userID, projectID, true).
            First(&assignment).Error

    if err != nil {
        return false // No asignado
    }

    return assignment.CanModify
}
```

### Verificar Acceso a Tarea

```go
func CanModifyTask(userID, taskID uint) bool {
    // 1. Verificar si está asignado al proyecto completo
    var task models.Task
    DB.First(&task, taskID)

    if CanModifyProject(userID, task.ProjectID) {
        return true // Tiene acceso por proyecto
    }

    // 2. Verificar si está asignado a la tarea específica
    var assignment models.TaskAssignment
    err := DB.Where("user_id = ? AND task_id = ? AND is_active = ?",
                    userID, taskID, true).
            First(&assignment).Error

    return err == nil && assignment.CanModify
}
```

---

## 🐛 Correcciones Aplicadas

### 1. Toast Warning

**Problema:** `Unknown event handler property onOpenChange`

**Solución:**

```jsx
// toaster.jsx
{
  toasts.map(function ({
    id,
    title,
    description,
    action,
    onOpenChange,
    ...props
  }) {
    // ← Extraemos onOpenChange para no pasarlo al div
    return (
      <Toast key={id} {...props}>
        ...
      </Toast>
    );
  });
}
```

### 2. Asignación Obligatoria

**Problema:** Error 400 al crear proyecto sin usuario

**Solución:**

- ✅ Eliminada validación obligatoria en frontend
- ✅ Eliminada validación obligatoria en backend
- ✅ Actualizado placeholder y textos de ayuda

---

## 📝 Migración de Datos Existentes

### Las asignaciones existentes (`assigned_user_id`) se mantienen por compatibilidad

```sql
-- Campo legacy (deprecated pero funcional)
ALTER TABLE projects ADD COLUMN assigned_user_id INTEGER;

-- Nueva relación many-to-many
CREATE TABLE project_assignments (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    can_modify BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    assigned_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Próximos Pasos (Pendientes)

### Endpoints a Implementar

1. **Asignar usuarios a proyecto**

   ```
   POST /api/v1/projects/{id}/assignments
   DELETE /api/v1/projects/{id}/assignments/{user_id}
   GET /api/v1/projects/{id}/assignments
   ```

2. **Asignar usuarios a tarea**

   ```
   POST /api/v1/tasks/{id}/assignments
   DELETE /api/v1/tasks/{id}/assignments/{user_id}
   GET /api/v1/tasks/{id}/assignments
   ```

3. **UI para gestión de asignaciones**
   - Modal con lista de usuarios
   - Multi-select para asignar varios
   - Toggle para `can_modify`
   - Lista de usuarios asignados actual

---

## ✅ Estado Actual

- ✅ Modelos creados (ProjectAssignment, TaskAssignment)
- ✅ Relaciones Many-to-Many configuradas
- ✅ Migraciones automáticas configuradas
- ✅ Frontend actualizado (asignación opcional)
- ✅ Backend actualizado (sin validación obligatoria)
- ✅ Warning de toast corregido
- ⏳ Endpoints de asignación (pendiente)
- ⏳ UI de gestión de asignaciones (pendiente)
- ⏳ Middleware de permisos (pendiente)

---

**Última actualización:** 2025-12-10  
**Versión:** 2.0
