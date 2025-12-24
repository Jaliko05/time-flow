# Requerimientos de Refactorización - TimeFlow

**Fecha:** 23 de Diciembre 2025  
**Estado:** ✅ FASES 1-7 COMPLETADAS  
**Última Actualización:** 24 de Diciembre 2025 - 09:30

## 🎉 Resumen de Implementación Completada

### **Archivos Creados en Esta Sesión: 45+ archivos**

#### Fase 5 - Frontend Requerimientos/Incidentes/Procesos: **15 archivos**

- ✅ Componentes de Procesos (7): ProcessCard, ProcessList, ProcessForm, ProcessActivitiesList, ProcessActivityForm, SortableActivityList, SortableActivityItem
- ✅ Badges Compartidos (3): StatusBadge, PriorityBadge, SeverityBadge
- ✅ Componentes de Detalle (4): RequirementCard, RequirementDetail, IncidentCard, IncidentDetail
- ✅ Multi-área (2): AreaMultiSelect, ProjectCard (actualizado)
- ✅ Hooks Personalizados (3): useRequirements, useIncidents, useProcesses

#### Fase 6 - Frontend Dashboards: **7 archivos**

- ✅ Componentes de Gráficas (2): ProgressRing, HeatmapCalendar
- ✅ Componentes de Dashboard (2): StatBox, DashboardLayout + DashboardSection
- ✅ Hooks y Utilidades (3): useDashboardMetrics, useChartData, chartHelpers

#### Fase 7 - Funcionalidades Avanzadas: **14 archivos**

- ✅ Componentes de Dependencias (1): dependencyValidator.js
- ✅ Drag & Drop (2): SortableActivityList, SortableActivityItem
- ✅ Export (2): ExportButton, exportHelpers.js
- ✅ Filtros y Búsqueda (3): AdvancedFilter, GlobalSearch, useAdvancedFilter
- ✅ Permisos (2): usePermissions, PermissionGate
- ✅ Notificaciones (3): NotificationContext, NotificationBell, NotificationItem

### **Total Código Implementado:**

- **Backend:** ~3,200 líneas (35+ endpoints, 9 modelos, 5 servicios)
- **Frontend Nuevo:** ~3,500 líneas (45+ archivos creados)
- **Frontend Previo:** ~1,751 líneas
- **TOTAL GENERAL:** ~8,450 líneas de código

### **Estado de Fases:**

| Fase | Descripción                          | Estado               |
| ---- | ------------------------------------ | -------------------- |
| 1    | Base de Datos y Modelos              | ✅ Completada        |
| 2    | Handlers y API                       | ✅ Completada        |
| 3    | Lógica de Asignación y Dependencias  | ✅ Completada        |
| 4    | Dashboards Backend                   | ✅ Completada        |
| 5    | Frontend - Estructura Base           | ✅ Completada        |
| 6    | Frontend - Dashboards                | ✅ Completada        |
| 7    | Frontend - Funcionalidades Avanzadas | ✅ Completada (Core) |
| 8    | Testing y Ajustes                    | 🔄 En Progreso       |

---

## 📋 Cambios de Roles y Permisos

### 1. Creación de Proyectos

- ✅ **ACTUAL:** Cualquier usuario puede crear proyectos personales
- 🔄 **NUEVO:** Solo `super_admin` y `admin` pueden crear proyectos
- **Impacto:** Backend (handlers/projects.go), Frontend (botones de creación)

---

## 📊 Dashboards por Rol

### 2. Dashboard SuperAdmin

**Métricas requeridas:**

- Vista consolidada de todas las áreas
- Estado de proyectos por área
- Disponibilidad de usuarios por área
- Gráficos:
  - Proyectos activos vs completados por área
  - Distribución de usuarios por área
  - Horas trabajadas por área
  - Tendencias de productividad

### 3. Dashboard Admin (Por Área)

**Métricas requeridas:**

- Vista de su área específica
- Estado de proyectos del área
- Disponibilidad de usuarios de su área
- Actividades de usuarios bajo su supervisión
- Gráficos:
  - Proyectos del área (estado)
  - Usuarios disponibles/ocupados
  - Horas trabajadas en la semana/mes
  - Cumplimiento de deadlines

---

## 🏢 Proyectos Multi-Área

### 4. Asignación de Proyectos a Múltiples Áreas

**Cambios en modelo:**

```go
// ACTUAL
type Project struct {
    AreaID *uint  // Una sola área
}

// NUEVO
type Project struct {
    Areas []Area `gorm:"many2many:project_areas;"` // Múltiples áreas
}
```

**Nueva tabla:** `project_areas` (junction table)

- project_id
- area_id
- created_at

**Lógica:**

- SuperAdmin asigna proyecto a múltiples áreas
- Admins de esas áreas pueden ver y gestionar el proyecto
- Usuarios de esas áreas pueden ser asignados

---

## 📦 Nueva Estructura de Proyectos

### 5. Tres Tipos de Componentes en Proyectos

```
PROYECTO
├── ACTIVIDADES (existente, mejorado)
├── REQUERIMIENTOS (nuevo)
└── INCIDENTES (nuevo)
```

#### 5.1 Actividades (mejorado)

- Ahora pueden tener **sub-actividades**
- Estructura jerárquica
- Se mantiene el registro diario para usuarios

#### 5.2 Requerimientos (nuevo)

- Tiene múltiples **procesos**
- Cada proceso tiene **actividades**
- Actividades pueden ser **dependientes** entre sí

#### 5.3 Incidentes (nuevo)

- Misma estructura que requerimientos
- Tiene múltiples **procesos**
- Cada proceso tiene **actividades**
- Actividades con dependencias

---

## 🔄 Modelos de Datos Nuevos

### 6. Modelo: Requerimiento

```go
type Requirement struct {
    ID          uint
    ProjectID   uint
    Name        string
    Description string
    Status      RequirementStatus // pending, in_progress, completed
    Priority    Priority
    Processes   []Process
    CreatedBy   uint
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

### 7. Modelo: Incidente

```go
type Incident struct {
    ID          uint
    ProjectID   uint
    Name        string
    Description string
    Severity    IncidentSeverity // low, medium, high, critical
    Status      IncidentStatus   // open, in_progress, resolved, closed
    Processes   []Process
    ReportedBy  uint
    CreatedAt   time.Time
    UpdatedAt   time.Time
}
```

### 8. Modelo: Proceso

```go
type Process struct {
    ID              uint
    Name            string
    Description     string
    RequirementID   *uint // Puede pertenecer a requirement
    IncidentID      *uint // O a incident
    ActivityID      *uint // O a activity principal
    Status          ProcessStatus
    Activities      []ProcessActivity // Actividades del proceso
    AssignedUsers   []User `gorm:"many2many:process_assignments;"`
    EstimatedHours  float64
    UsedHours       float64
    CreatedAt       time.Time
}
```

### 9. Modelo: ProcessActivity (Actividad de Proceso)

```go
type ProcessActivity struct {
    ID              uint
    ProcessID       uint
    Name            string
    Description     string
    Status          ActivityStatus
    Order           int
    DependsOn       *uint // ID de otra actividad (dependencia)
    AssignedUserID  uint
    EstimatedHours  float64
    UsedHours       float64
    StartDate       *time.Time
    EndDate         *time.Time
    CreatedAt       time.Time
}
```

### 10. Actividad Mejorada (con sub-actividades)

```go
type Activity struct {
    ID              uint
    ProjectID       uint
    Name            string
    Description     string
    ParentActivityID *uint // Para sub-actividades
    SubActivities   []Activity `gorm:"foreignKey:ParentActivityID"`
    Status          ActivityStatus
    // ... resto de campos existentes
}
```

---

## 👥 Cambios en Permisos de Usuarios

### 11. Visibilidad de Proyectos para Usuarios

**ACTUAL:** Usuario ve proyectos asignados directamente

**NUEVO:** Usuario ve proyectos donde tiene procesos asignados

- Si está asignado a un proceso de un requerimiento → ve el proyecto
- Si está asignado a un proceso de un incidente → ve el proyecto
- Si está asignado a un proceso de una actividad → ve el proyecto

**Query necesario:**

```sql
SELECT DISTINCT projects.*
FROM projects
INNER JOIN process_assignments ON ...
WHERE process_assignments.user_id = ?
```

### 12. Actividades Diarias (Solo Usuarios)

- Los usuarios siguen registrando actividades diarias
- Ahora pueden registrar tiempo en:
  - Actividades normales del proyecto
  - Sub-actividades
  - Actividades de procesos de requerimientos
  - Actividades de procesos de incidentes

---

## 🎨 Cambios en UI - Menús por Rol

### 13. Menú Admin

```
├── 📊 Dashboard (nuevo diseño)
├── 📁 Proyectos (solo los de su área)
├── ⏱️ Actividades de Usuarios (de su área)
└── ⚙️ Configuración
```

### 14. Menú SuperAdmin

```
├── 📊 Dashboard Global (por áreas)
├── 📁 Proyectos (todos)
├── 🏢 Áreas (gestión)
├── 👥 Usuarios (todos)
└── ⚙️ Configuración
```

### 15. Menú Usuario (sin cambios mayores)

```
├── 📊 Mi Dashboard
├── ⏱️ Mis Actividades Diarias
├── 📁 Mis Proyectos (procesos asignados)
└── 📅 Calendario
```

---

## 🔍 Migraciones de Base de Datos Requeridas

### Nuevas Tablas

1. ✅ `project_areas` - Proyectos multi-área
2. ✅ `requirements` - Requerimientos
3. ✅ `incidents` - Incidentes
4. ✅ `processes` - Procesos (compartidos)
5. ✅ `process_activities` - Actividades de procesos
6. ✅ `process_assignments` - Asignación usuarios a procesos

### Modificaciones

1. ✅ `projects` - Remover `area_id`, usar relación many2many
2. ✅ `activities` - Agregar `parent_activity_id` para jerarquía

---

## 📅 Plan de Implementación Sugerido

### **FASE 1: Base de Datos y Modelos** ✅ (COMPLETADA)

**Orden:** 1️⃣  
**Fecha Completada:** 23 de Diciembre 2025

- [x] Crear modelos nuevos (Requirement, Incident, Process, ProcessActivity)
- [x] Modificar modelo Project para multi-área
- [x] Modificar modelo Activity para sub-actividades
- [x] Crear migraciones automáticas con GORM AutoMigrate
- [x] Aplicar migraciones (dos fases para resolver dependencias)
- [x] Resolver dependencia circular Activity ↔ Process

**Archivos modificados:**

- `backend/models/requirement.go` ✅ (nuevo - 71 líneas)
- `backend/models/incident.go` ✅ (nuevo - 92 líneas)
- `backend/models/process.go` ✅ (nuevo - 154 líneas)
- `backend/models/project.go` ✅ (modificar - añadida relación multi-área)
- `backend/models/activity.go` ✅ (modificar - sub-actividades + ProcessID)
- `backend/config/database.go` ✅ (migraciones automáticas en dos fases)
- `backend/migrations/add_new_structure.sql` ✅ (referencia)

**Logros adicionales:**

- Sistema de migraciones automáticas implementado
- Función `migrateExistingData()` para migrar projects.area_id → project_areas
- 10 índices adicionales creados para optimización
- Documentación en MIGRACIONES_AUTOMATICAS.md

**Tablas creadas:**

- `requirements` (requerimientos de proyectos)
- `incidents` (incidentes de proyectos)
- `processes` (procesos compartidos)
- `process_activities` (actividades de procesos con dependencias)
- `process_assignments` (asignación usuarios → procesos)
- `project_areas` (relación many-to-many proyectos ↔ áreas)

---

### **FASE 2: Handlers y API** ✅ (COMPLETADA)

**Orden:** 2️⃣  
**Fecha Completada:** 23 de Diciembre 2025

- [x] CRUD para Requirements (5 endpoints)
- [x] CRUD para Incidents (6 endpoints + resolución)
- [x] CRUD para Processes (13 endpoints + dependencias)
- [x] CRUD para ProcessActivities (con validación de dependencias)
- [x] Actualizar ProjectHandler para multi-área
- [x] Actualizar permisos de creación de proyectos (solo Admin/SuperAdmin)

**Archivos modificados:**

- `backend/handlers/requirements.go` ✅ (nuevo - 321 líneas)
- `backend/handlers/incidents.go` ✅ (nuevo - 406 líneas)
- `backend/handlers/processes.go` ✅ (nuevo - 773 líneas)
- `backend/handlers/projects.go` ✅ (modificado - multi-área + restricción admin)
- `backend/middleware/authorization.go` ✅ (3 funciones nuevas)
- `backend/routes/routes.go` ✅ (30+ rutas nuevas)
- `backend/models/request.go` ✅ (campo AreaIDs agregado)

**Funcionalidades implementadas:**

- **Requirements:** CRUD completo con validación de permisos por área
- **Incidents:** CRUD + resolución de incidentes con timestamps
- **Processes:** Creación desde Requirements/Incidents/Activities con asignación de usuarios
- **Process Activities:** Actividades con dependencias secuenciales y validación
- **Multi-área:** Proyectos pueden pertenecer a múltiples áreas simultáneamente
- **Restricción:** Solo Admin/SuperAdmin pueden crear proyectos
- **Asignación de usuarios:** Many-to-many con AssignedUsers usando GORM associations

**Endpoints creados (30+):**

Requirements:

- GET /projects/:project_id/requirements
- GET /requirements/:id
- POST /requirements
- PUT /requirements/:id
- DELETE /requirements/:id

Incidents:

- GET /projects/:project_id/incidents
- GET /incidents/:id
- POST /incidents
- PUT /incidents/:id
- POST /incidents/:id/resolve
- DELETE /incidents/:id

Processes:

- GET /processes/:id
- POST /requirements/:id/processes
- POST /incidents/:id/processes
- POST /activities/:id/processes
- PUT /processes/:id
- DELETE /processes/:id
- GET /processes/:process_id/activities
- POST /processes/:process_id/activities
- PUT /process-activities/:id
- POST /processes/:process_id/assign
- GET /process-activities/:id/validate-dependencies

---

### **FASE 3: Lógica de Asignación y Dependencias** ✅

**Orden:** 3️⃣  
**Estado:** Completado  
**Fecha:** 23 de Diciembre 2025

- [x] Sistema de dependencias entre ProcessActivities
- [x] Validación de dependencias cumplidas
- [x] Asignación de usuarios a procesos
- [x] Query de proyectos visibles para usuarios
- [x] Endpoints de workload y carga de trabajo
- [x] Endpoints de cadena de dependencias

**Archivos creados/modificados:**

- ✅ `backend/services/dependency_service.go` (nuevo - 200 líneas)

  - ValidateActivityDependency()
  - CheckCircularDependency()
  - GetBlockedActivities()
  - GetDependencyChain()
  - CanStartActivity()
  - UpdateActivityStatus()

- ✅ `backend/services/assignment_service.go` (nuevo - 250 líneas)

  - AssignUserToProcess()
  - RemoveUserFromProcess()
  - GetUserAssignedProcesses()
  - **GetProjectsVisibleToUser()** (query complejo con subqueries)
  - GetUserWorkload()
  - CanUserAccessProcess()

- ✅ `backend/handlers/workload.go` (nuevo - 145 líneas)

  - GET /users/:id/workload
  - GET /users/:id/processes
  - GET /process-activities/:id/dependency-chain
  - GET /process-activities/:id/blocked
  - DELETE /processes/:process_id/unassign/:user_id

- ✅ `backend/handlers/projects.go` (modificado)
  - GetProjects() refactorizado para usar AssignmentService.GetProjectsVisibleToUser()
- ✅ `backend/handlers/processes.go` (modificado)

  - GetProcessAssignments() agregado

- ✅ `backend/routes/routes.go` (actualizado con nuevas rutas)

**Endpoints nuevos:** 5  
**Total Fase 3:** 5 endpoints + 2 servicios

---

### **FASE 4: Dashboards Backend** ✅

**Orden:** 4️⃣  
**Estado:** Completado  
**Fecha:** 23 de Diciembre 2025

- [x] Endpoint dashboard SuperAdmin (métricas globales)
- [x] Endpoint dashboard Admin (métricas por área)
- [x] Endpoint dashboard Usuario (métricas personales)
- [x] Queries optimizados con agregaciones
- [x] Servicio de métricas con cálculos complejos

**Archivos creados:**

- ✅ `backend/services/metrics_service.go` (nuevo - 494 líneas)

  - SuperAdminMetrics: métricas globales de todas las áreas
  - AdminMetrics: métricas de área específica con workload de usuarios
  - UserMetrics: métricas personales del usuario
  - Agregaciones complejas con JOINs optimizados
  - Cálculo de proyectos por área, usuarios por área
  - Distribución de estados de proyectos
  - Deadlines próximos por área y por usuario
  - Actividad reciente

- ✅ `backend/handlers/dashboard.go` (nuevo - 125 líneas)

  - GET /dashboard/superadmin (requiere RoleSuperAdmin)
  - GET /dashboard/admin (requiere RoleAdmin)
  - GET /dashboard/user (requiere RoleUser)

- ✅ `backend/routes/routes.go` (actualizado con rutas de dashboard)

**Métricas implementadas:**

_SuperAdmin:_

- Total áreas, usuarios, proyectos
- Proyectos activos/completados
- Requerimientos, incidentes, procesos
- Proyectos por área
- Usuarios por área
- Distribución de estados
- Actividad reciente

_Admin:_

- Usuarios del área (total/disponibles/ocupados)
- Proyectos del área (total/activos/completados)
- Requerimientos e incidentes del área
- Carga de trabajo de usuarios (workload)
- Deadlines próximos
- Distribución de estados

_User:_

- Proyectos asignados (directos + a través de procesos)
- Actividades (total/pendientes/completadas)
- Procesos asignados (total/activos)
- Horas trabajadas (temporalmente en 0, pendiente ActivityLog)
- Deadlines próximos

**Endpoints nuevos:** 3  
**Total Fase 4:** 3 endpoints + 1 servicio

---

### **FASE 5: Frontend - Estructura Base** ✅

**Orden:** 5️⃣ **COMPLETADA**

#### 5.1 Actualizar Sistema de Navegación ✅

- [x] **Layout.jsx** - Menús diferentes según rol ✅
  - SuperAdmin: Dashboard Global, Proyectos, Áreas, Usuarios, Configuración ✅
  - Admin: Dashboard, Proyectos (área), Actividades Usuarios, Configuración ✅
  - Usuario: Dashboard, Actividades Diarias, Mis Proyectos, Calendario ✅
- [x] **ProtectedRoute.jsx** - Validación de permisos por rol ✅
- [x] Rutas en `App.jsx` con allowedRoles ✅

#### 5.2 API Clients - Nuevos Endpoints ✅

- [x] **`frontend/src/api/requirements.js`** (nuevo - 71 líneas) ✅
- [x] **`frontend/src/api/incidents.js`** (nuevo - 83 líneas) ✅
- [x] **`frontend/src/api/processes.js`** (nuevo - 212 líneas) ✅
- [x] **`frontend/src/api/dashboard.js`** (nuevo - 28 líneas) ✅
- [x] **`frontend/src/api/projects.js`** (modificado - soporte multi-área) ✅
- [x] **`frontend/src/api/index.js`** (actualizado) ✅

**Archivos creados:** 4 | **Modificados:** 2 | **Total líneas:** ~394 ✅

#### 5.3 Páginas Nuevas ✅

- [x] **`frontend/src/pages/Requirements.jsx`** (215 líneas) ✅
  - Vista de requerimientos de un proyecto
  - Lista de requerimientos con estados
  - Botón crear (solo admin/super_admin)
  - Tabla con columnas: Nombre, Estado, Prioridad, Procesos, Acciones
- [x] **`frontend/src/pages/Incidents.jsx`** (242 líneas) ✅
  - Vista de incidentes de un proyecto
  - Lista de incidentes con severidad
  - Botón reportar incidente
  - Tabla con: Nombre, Severidad, Estado, Procesos, Reportado por, Fecha

#### 5.4 Componentes de Requirements ✅

- [x] **`frontend/src/components/requirements/RequirementsList.jsx`** (184 líneas) ✅
  - Tabla/Cards de requerimientos
  - Filtros por estado y prioridad
  - Expandir para ver procesos
- [x] **`frontend/src/components/requirements/RequirementCard.jsx`** (85 líneas) ✅
  - Card individual con info resumida
  - Badge de estado y prioridad
  - Click para ver detalle
- [x] **`frontend/src/components/requirements/RequirementForm.jsx`** (146 líneas) ✅
  - Formulario crear/editar requerimiento
  - Campos: Nombre, Descripción, Prioridad, Estado
  - Validaciones
- [x] **`frontend/src/components/requirements/RequirementDetail.jsx`** (150 líneas) ✅
  - Modal/página de detalle completo
  - Sección de procesos asociados
  - Historial de cambios

#### 5.5 Componentes de Incidents ✅

- [x] **`frontend/src/components/incidents/IncidentsList.jsx`** (230 líneas) ✅
  - Tabla/Cards de incidentes
  - Filtros por severidad y estado
  - Destacar incidentes críticos
- [x] **`frontend/src/components/incidents/IncidentCard.jsx`** (90 líneas) ✅
  - Card con indicador de severidad (colores)
  - Tiempo desde reporte
  - Estado actual
- [x] **`frontend/src/components/incidents/IncidentForm.jsx`** (156 líneas) ✅
  - Formulario reportar/editar incidente
  - Selector de severidad (baja, media, alta, crítica)
  - Descripción detallada
- [x] **`frontend/src/components/incidents/IncidentDetail.jsx`** (170 líneas) ✅
  - Detalle completo del incidente
  - Timeline de estados
  - Procesos de resolución

#### 5.6 Componentes de Procesos (Compartidos) ✅

- [x] **`frontend/src/components/processes/ProcessCard.jsx`** (130 líneas) ✅
  - Card de proceso (usado en requirements, incidents, activities)
  - Muestra: Nombre, Estado, Usuarios asignados, Progreso
  - Indicador de horas estimadas vs usadas
- [x] **`frontend/src/components/processes/ProcessList.jsx`** (85 líneas) ✅
  - Lista de procesos de un requirement/incident/activity
  - Agregar nuevo proceso
  - Expandir para ver actividades del proceso
- [x] **`frontend/src/components/processes/ProcessForm.jsx`** (165 líneas) ✅
  - Formulario crear/editar proceso
  - Asignar usuarios al proceso
  - Estimación de horas
- [x] **`frontend/src/components/processes/ProcessActivitiesList.jsx`** (115 líneas) ✅
  - Lista de actividades dentro de un proceso
  - Mostrar dependencias visualmente
  - Drag & drop para reordenar (opcional en esta fase)
- [x] **`frontend/src/components/processes/ProcessActivityForm.jsx`** (200 líneas) ✅
  - Formulario para actividad de proceso
  - Selector de dependencias (otras actividades)
  - Asignar usuario específico
  - Fechas inicio/fin

#### 5.7 Modificar Componentes Existentes ✅

- [x] **`frontend/src/pages/ProjectDetail.jsx`** - CAMBIO MAYOR ✅

  - Agregadas 4 tabs: Tasks, Requirements, Incidents, Comments
  - Navegación a páginas dedicadas

- [x] **`frontend/src/components/projects/ProjectCard.jsx`** ✅
  - Indicador de múltiples áreas ✅
  - Mostrar badges de áreas asignadas ✅
  - Límite de 2 badges visibles + contador "+N" ✅
- [x] **`frontend/src/components/projects/ProjectFormDialog.jsx`** ✅

  - Selector multi-área (AreaMultiSelect) ✅
  - Solo visible para super_admin ✅
  - Validación: al menos un área seleccionada ✅
  - Campo area_ids[] enviado al backend ✅

- [x] **`frontend/src/components/activities/ActivityCard.jsx`** ✅

  - Soporte para sub-actividades (campo parent_activity_id) ✅
  - Jerarquía visual con indentación ✅
  - Expandir/colapsar sub-actividades ✅ ✅

- [x] **`frontend/src/components/common/StatusBadge.jsx`** (65 líneas) ✅
  - Badge reutilizable para estados
  - Colores según tipo: requirement, incident, process, activity
- [x] **`frontend/src/components/common/PriorityBadge.jsx`** (60 líneas) ✅
  - Badge de prioridad (baja, media, alta)
- [x] **`frontend/src/components/common/SeverityBadge.jsx`** (60 líneas) ✅
  - Badge de severidad para incidentes
  - Colores: verde, amarillo, naranja, rojo
- [x] **`frontend/src/components/common/UserAssignmentSelect.jsx`** (210 líneas) ✅
  - Selector de usuarios para asignar
  - Filtrar por área si aplica
  - Multi-select con popover y búsqueda
- [x] **`frontend/src/components/common/AreaMultiSelect.jsx`** (112 líneas) ✅
  - Multi-select
- [ ] **`frontend/src/components/common/AreaMultiSelect.jsx`**

  - Selector múltiple de áreas
  - Usado en formulario de pr ✅

- [x] **`frontend/src/hooks/useRequirements.js`** (85 líneas) ✅
  - Fetch, create, update, delete requirements
  - Estado de loading y errores
  - Integración con TanStack Query
- [x] **`frontend/src/hooks/useIncidents.js`** (85 líneas) ✅
  - Fetch, create, update, delete incidents
  - Manejo de severidad y estados
- [x] **`frontend/src/hooks/useProcesses.js`** (120 líneas) ✅
  - Manejo de procesos según contexto
  - Soporte para requirements, incidents y activities
  - Asignación de usuarios a procesos

**Resumen Fase 5:**

- **Archivos creados:** 20 (4 API + 2 páginas + 9 componentes + 5 utilidades) ✅
- **Archivos modificados:** 6 (ProjectCard, ProjectFormDialog, Layout, ProtectedRoute, index.jsx, api/index.js) ✅
- **Total líneas:** ~2,100 líneas ✅
- **Estado:** **100% COMPLETADA** ✅
- **Build:** Exitoso (dist/index.js 983.72KB), pages/index.jsx) ✅
- **Total líneas:** ~1,567 líneas ✅
- **Estado:** Core completado - Requirements e Incidents totalmente funcionales ✅

---

### **FASE 6: Frontend - Dashboards** ✅

**Orden:** 6️⃣ **COMPLETADA**

#### 6.1 Instalar Librería de Gráficos ✅

```bash
cd frontend
pnpm install recharts
```

#### 6.2 API Clients para Dashboards ✅

- [x] **`frontend/src/api/dashboard.js`** (28 líneas) ✅
  - getSuperAdminMetrics() ✅
  - getAdminMetrics(areaId) ✅
  - getUserMetrics(userId) ✅

#### 6.3 Dashboard SuperAdmin ✅

- [x] **`frontend/src/pages/SuperAdminDashboard.jsx`** (169 líneas) ✅
  - Layout con grid de métricas
  - 4 MetricCards (proyectos, usuarios, áreas, horas)
  - Gráfico circular: proyectos por estado
  - Gráfico de barras: proyectos por área
  - Grid de proyectos recientes

#### 6.4 Dashboard Admin (Por Área) ✅

- [x] **`frontend/src/pages/AdminDashboard.jsx`** (206 líneas) ✅
  - 4 MetricCards del área
  - Gráfico circular: proyectos por estado
  - Card de carga de trabajo con ProgressBars
  - Tabla completa de usuarios del área

#### 6.5 Dashboard Usuario (Mejorado)

- [x] **`frontend/src/pages/UserDashboard.jsx`** (ya existía)
  - El componente ya existe en dashboard/UserDashboard.jsx
  - Ya implementado en fases anteriores

#### 6.6 Componentes de Gráficos Reutilizables ✅

- [x] **`frontend/src/components/charts/BarChart.jsx`** (31 líneas) ✅
- [x] **`frontend/src/components/charts/LineChart.jsx`** (43 líneas) ✅
- [x] **`frontend/src/components/charts/PieChart.jsx`** (38 líneas) ✅
- [x] **`frontend/src/components/charts/ProgressRing.jsx`** (71 líneas) ✅
- [x] **`frontend/src/components/charts/HeatmapCalendar.jsx`** (104 líneas) ✅

#### 6.7 Componentes de Métricas ✅

- [x] **`frontend/src/components/dashboard/MetricCard.jsx`** (48 líneas) ✅
- [x] **`frontend/src/components/dashboard/TrendIndicator.jsx`** (38 líneas) ✅
- [x] **`frontend/src/components/dashboard/StatBox.jsx`** (52 líneas) ✅
- [x] **`frontend/src/components/dashboard/ProgressBar.jsx`** (39 líneas) ✅

#### 6.8 Layouts y Wrappers ✅

- [x] **`frontend/src/components/dashboard/DashboardLayout.jsx`** (33 líneas) ✅
- [x] **`frontend/src/components/dashboard/DashboardSection.jsx`** (incluido en DashboardLayout) ✅

#### 6.9 Hooks para Dashboards ✅

- [x] **`frontend/src/hooks/useDashboardMetrics.js`** (48 líneas) ✅
- [x] **`frontend/src/hooks/useChartData.js`** (76 líneas) ✅

#### 6.10 Utilidades de Datos ✅

- [x] **`frontend/src/utils/chartHelpers.js`** (148 líneas) ✅

**Resumen Fase 6:**

- **Archivos creados:** 14 (5 gráficos + 4 métricas + 2 páginas + 2 hooks + 1 utilidad) ✅
- **Total líneas:** ~851 líneas ✅
- **Dependencia:** recharts instalada ✅
- **Estado:** **100% COMPLETADA** - Dashboards operacionales con gráficos interactivos por rol ✅
- **Build:** Compilando correctamente ✅

````

---

### **FASE 7: Frontend - Funcionalidades Avanzadas** ✅

**Orden:** 7️⃣ **COMPLETADA (Core funcionalidades)**

**Resumen Fase 7:**
- **Archivos creados:** 14 (3 utils + 2 drag&drop + 6 common + 3 hooks/contexts) ✅
- **Total líneas:** ~1,200 líneas ✅
- **Dependencias:** @dnd-kit, xlsx, jspdf, cmdk instaladas ✅
- **Estado:** Core funcionalidades implementadas ✅

#### 7.1 Sistema de Dependencias Visuales ⚠️ PENDIENTE (Opcional)

- [ ] **`frontend/src/components/processes/DependencyGraph.jsx`**
  - Visualización de dependencias entre actividades
  - Nodos para cada actividad
  - Flechas mostrando dependencias
  - Colores según estado (completado, en progreso, bloqueado)
  - Librería sugerida: `react-flow-renderer` o `cytoscape`
- [ ] **`frontend/src/components/processes/DependencySelector.jsx`**
  - Selector de actividades para marcar como dependencia
  - Validar dependencias circulares
  - Mostrar advertencia si bloquea otras actividades
- [ ] **`frontend/src/components/processes/ActivityStatusFlow.jsx`**
  - Indicador visual del flujo de actividades
  - Destacar actividades desbloqueadas al completar dependencias

#### 7.2 Drag & Drop ✅

- [x] **`frontend/src/components/processes/SortableActivityList.jsx`** ✅
- [x] **`frontend/src/components/processes/SortableActivityItem.jsx`** ✅
- [ ] **`frontend/src/components/projects/ProjectKanban.jsx`** (opcional)

#### 7.3 Validaciones en Frontend ✅

- [x] **`frontend/src/utils/dependencyValidator.js`** ✅
  - hasCyclicDependency(), canStartActivity(), getBlockedActivities(), getDependencyChain()

#### 7.4 Sistema de Notificaciones ✅

- [ ] **`frontend/src/contexts/NotificationContext.jsx`**
  - Context para manejar notificaciones en tiempo real
  - WebSocket o polling para actualizaciones
- [x] **`frontend/src/contexts/NotificationContext.jsx`** ✅
- [x] **`frontend/src/components/common/NotificationBell.jsx`** ✅
- [x] **`frontend/src/components/common/NotificationItem.jsx`** ✅

#### 7.5 Filtros Avanzados ✅

- [x] **`frontend/src/components/common/AdvancedFilter.jsx`** ✅
- [x] **`frontend/src/hooks/useAdvancedFilter.js`** ✅

#### 7.6 Búsqueda Global ✅

- [x] **`frontend/src/components/common/GlobalSearch.jsx`** ✅

#### 7.7 Exportación de Datos ✅

- [x] **`frontend/src/components/common/ExportButton.jsx`** ✅
- [x] **`frontend/src/utils/exportHelpers.js`** ✅

#### 7.8 Vista de Timeline/Gantt

- [ ] **`frontend/src/components/projects/ProjectTimeline.jsx`** (opcional)

#### 7.9 Comentarios y Colaboración ✅

- [x] Sistema de comentarios ya existe en proyectos/actividades

#### 7.10 Permisos y Restricciones Visuales ✅

- [x] **`frontend/src/hooks/usePermissions.js`** ✅
- [x] **`frontend/src/components/common/PermissionGate.jsx`** ✅

#### 7.11 Responsive y Mobile (Mejoras futuras)

- [ ] Ajustar todos los dashboards para mobile
- [ ] Touch gestures para drag & drop en mobile

#### 7.12 Optimizaciones de UX (Mejoras futuras)

- [ ] **Skeleton loaders** para carga de datos
- [ ] **Infinite scroll** para listas largas

**Resumen Fase 7 - Archivos implementados:**

| Categoría | Archivos | Estado |
|-----------|----------|--------|
| Notificaciones | NotificationContext, NotificationBell, NotificationItem | ✅ |
| Filtros | AdvancedFilter, useAdvancedFilter | ✅ |
| Búsqueda | GlobalSearch | ✅ |
| Exportación | ExportButton, exportHelpers | ✅ |
| Permisos | usePermissions, PermissionGate | ✅ |
| Drag & Drop | SortableActivityList, SortableActivityItem | ✅ |
| Validaciones | dependencyValidator | ✅ |

**Total:** 14 archivos implementados ✅

---

### **FASE 8: Testing y Ajustes** 🔄 EN PROGRESO

**Orden:** 8️⃣

#### 8.1 Testing de Endpoints Backend

- [ ] **Test de Autenticación y Autorización**

  - [ ] Login con diferentes roles
  - [ ] Validación de tokens JWT
  - [ ] Refresh tokens
  - [ ] Permisos por endpoint según rol

- [ ] **Test de Proyectos**

  - [ ] CRUD de proyectos
  - [ ] Multi-área (crear/actualizar/listar)
  - [ ] Filtrado por área
  - [ ] Asignación de usuarios

- [ ] **Test de Áreas**

  - [ ] CRUD de áreas
  - [ ] Asignación de usuarios a áreas
  - [ ] Permisos de Admin por área

- [ ] **Test de Actividades**

  - [ ] CRUD de actividades
  - [ ] Jerarquía (sub-actividades)
  - [ ] Dependencias entre actividades
  - [ ] Validación de dependencias circulares

- [ ] **Test de Requerimientos**

  - [ ] CRUD de requerimientos
  - [ ] Estados y transiciones
  - [ ] Filtros y búsquedas

- [ ] **Test de Incidentes**

  - [ ] CRUD de incidentes
  - [ ] Severidad y categorías
  - [ ] Asignación y resolución

- [ ] **Test de Procesos**

  - [ ] CRUD de procesos
  - [ ] Actividades dentro de procesos
  - [ ] Dependencias entre actividades

- [ ] **Test de Comentarios**

  - [ ] Crear comentarios en actividades
  - [ ] Listar comentarios

- [ ] **Test de Dashboard/Métricas**
  - [ ] Métricas SuperAdmin
  - [ ] Métricas Admin (por área)
  - [ ] Validación de cálculos

#### 8.2 Testing de Validaciones

- [ ] **Validaciones de Dependencias**

  - [ ] Prevención de ciclos
  - [ ] Cadena de dependencias
  - [ ] Estado de actividades bloqueadas
  - [ ] Validación de inicio de actividades

- [ ] **Validaciones de Permisos**

  - [ ] SuperAdmin: Acceso total
  - [ ] Admin: Solo su área
  - [ ] User: Solo sus asignaciones

- [ ] **Validaciones de Datos**
  - [ ] Campos requeridos
  - [ ] Formatos de fecha
  - [ ] Rangos numéricos
  - [ ] Unicidad de nombres

#### 8.3 Testing de Performance

- [ ] **Optimización de Queries**

  - [ ] Índices en tablas críticas
  - [ ] Queries N+1
  - [ ] Joins innecesarios

- [ ] **Carga de Datos**

  - [ ] Paginación efectiva
  - [ ] Límites de resultados
  - [ ] Carga lazy de relaciones

- [ ] **Cache**
  - [ ] Dashboard metrics
  - [ ] Listas frecuentes
  - [ ] Estadísticas

#### 8.4 Documentación API

- [ ] **Actualizar Swagger**

  - [ ] Todos los endpoints nuevos
  - [ ] Modelos de request/response
  - [ ] Códigos de error
  - [ ] Ejemplos de uso

- [ ] **README técnico**
  - [ ] Arquitectura actualizada
  - [ ] Nuevos modelos
  - [ ] Flujos de trabajo

#### 8.5 Testing Manual Frontend

- [ ] **Flujos Completos**

  - [ ] Crear proyecto multi-área
  - [ ] Crear proceso con actividades
  - [ ] Establecer dependencias
  - [ ] Validar dashboards
  - [ ] Probar filtros avanzados
  - [ ] Probar exportaciones

- [ ] **Compatibilidad**
  - [ ] Responsive en móvil
  - [ ] Navegadores (Chrome, Firefox, Edge)
  - [ ] Temas claro/oscuro

#### 8.6 Ajustes Finales

- [ ] **Code Review**

  - [ ] Limpiar console.logs
  - [ ] Eliminar código comentado
  - [ ] Validar nombres de variables
  - [ ] Verificar imports no usados

- [ ] **Performance Frontend**

  - [ ] Lazy loading de componentes
  - [ ] Memoización donde sea necesario
  - [ ] Optimizar re-renders

- [ ] **Manejo de Errores**
  - [ ] Mensajes de error claros
  - [ ] Fallbacks para errores de red
  - [ ] Loading states consistentes

---

## ⚠️ Consideraciones Importantes

### Datos Existentes

- ❗ **Proyectos actuales:** Necesitan migración a multi-área (asignar a un área default)
- ❗ **Actividades actuales:** Mantener compatibilidad (parent_activity_id = NULL)
- ❗ **Usuarios:** Verificar permisos de creación de proyectos

### Performance

- Índices en tablas nuevas (process_id, requirement_id, incident_id)
- Índices compuestos en project_areas (project_id, area_id)
- Cache para dashboards con muchas métricas

### Migraciones Seguras

```sql
-- Asignar proyectos existentes a su área actual
INSERT INTO project_areas (project_id, area_id)
SELECT id, area_id FROM projects WHERE area_id IS NOT NULL;
```

---

## 🎯 Recomendación de Inicio

### **EMPEZAR POR FASE 1:**

1. Crear rama nueva: `git checkout -b feature/nueva-estructura`
2. Crear modelos nuevos en backend
3. Crear migraciones pero **NO aplicarlas aún**
4. Hacer commit incremental
5. Revisar y testear modelos
6. Aplicar migraciones en base de datos de desarrollo
7. Verificar que todo funcione antes de continuar

### Tiempo Estimado por Fase:

- Fase 1: 4-6 horas
- Fase 2: 6-8 horas
- Fase 3: 4-5 horas
- Fase 4: 3-4 horas
- Fase 5: 6-8 horas
- Fase 6: 5-7 horas
- Fase 7: 4-6 horas
- Fase 8: 3-4 horas

**TOTAL ESTIMADO:** 35-48 horas de desarrollo

---

## 📝 Notas Adicionales

- Mantener el código actual funcionando en main/master
- Trabajar en rama separada
- Commits frecuentes y descriptivos
- Testing después de cada fase
- Documentar cambios importantes

---

**¿Por dónde empezamos?** 👉 FASE 1: Modelos y Base de Datos
````
