# Requerimientos de Refactorización - TimeFlow

**Fecha:** 23 de Diciembre 2025  
**Estado:** En Progreso - Fase 4 Completada ✅  
**Última Actualización:** 23 de Diciembre 2025 - 16:00

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

### **FASE 5: Frontend - Estructura Base**

**Orden:** 5️⃣

#### 5.1 Actualizar Sistema de Navegación

- [ ] **Layout.jsx** - Modificar sidebar para mostrar menús diferentes según rol
  - SuperAdmin: Dashboard Global, Proyectos, Áreas, Usuarios, Configuración
  - Admin: Dashboard, Proyectos (área), Actividades Usuarios, Configuración
  - Usuario: Dashboard, Actividades Diarias, Mis Proyectos, Calendario
- [ ] **ProtectedRoute.jsx** - Agregar validación de permisos por rol
- [ ] Crear nuevas rutas en `App.jsx` o `routes.js`

#### 5.2 API Clients - Nuevos Endpoints

- [ ] **`frontend/src/api/requirements.js`** (nuevo)
  ```js
  export const getRequirements = (projectId) => ...
  export const createRequirement = (data) => ...
  export const updateRequirement = (id, data) => ...
  export const deleteRequirement = (id) => ...
  ```
- [ ] **`frontend/src/api/incidents.js`** (nuevo)
  ```js
  export const getIncidents = (projectId) => ...
  export const createIncident = (data) => ...
  export const updateIncident = (id, data) => ...
  export const deleteIncident = (id) => ...
  ```
- [ ] **`frontend/src/api/processes.js`** (nuevo)
  ```js
  export const getProcesses = (requirementId, incidentId, activityId) => ...
  export const createProcess = (data) => ...
  export const assignUserToProcess = (processId, userId) => ...
  export const getProcessActivities = (processId) => ...
  export const updateProcessActivity = (id, data) => ...
  ```
- [ ] **`frontend/src/api/projects.js`** (modificar)
  - Agregar soporte para multi-área
  - Actualizar `createProject` para enviar array de áreas

#### 5.3 Páginas Nuevas

- [ ] **`frontend/src/pages/Requirements.jsx`**
  - Vista de requerimientos de un proyecto
  - Lista de requerimientos con estados
  - Botón crear (solo admin/super_admin)
  - Tabla con columnas: Nombre, Estado, Prioridad, Procesos, Acciones
- [ ] **`frontend/src/pages/Incidents.jsx`**
  - Vista de incidentes de un proyecto
  - Lista de incidentes con severidad
  - Botón reportar incidente
  - Tabla con: Nombre, Severidad, Estado, Procesos, Reportado por, Fecha

#### 5.4 Componentes de Requirements

- [ ] **`frontend/src/components/requirements/RequirementsList.jsx`**
  - Tabla/Cards de requerimientos
  - Filtros por estado y prioridad
  - Expandir para ver procesos
- [ ] **`frontend/src/components/requirements/RequirementCard.jsx`**
  - Card individual con info resumida
  - Badge de estado y prioridad
  - Click para ver detalle
- [ ] **`frontend/src/components/requirements/RequirementForm.jsx`**
  - Formulario crear/editar requerimiento
  - Campos: Nombre, Descripción, Prioridad, Estado
  - Validaciones
- [ ] **`frontend/src/components/requirements/RequirementDetail.jsx`**
  - Modal/página de detalle completo
  - Sección de procesos asociados
  - Historial de cambios

#### 5.5 Componentes de Incidents

- [ ] **`frontend/src/components/incidents/IncidentsList.jsx`**
  - Tabla/Cards de incidentes
  - Filtros por severidad y estado
  - Destacar incidentes críticos
- [ ] **`frontend/src/components/incidents/IncidentCard.jsx`**
  - Card con indicador de severidad (colores)
  - Tiempo desde reporte
  - Estado actual
- [ ] **`frontend/src/components/incidents/IncidentForm.jsx`**
  - Formulario reportar/editar incidente
  - Selector de severidad (baja, media, alta, crítica)
  - Descripción detallada
- [ ] **`frontend/src/components/incidents/IncidentDetail.jsx`**
  - Detalle completo del incidente
  - Timeline de estados
  - Procesos de resolución

#### 5.6 Componentes de Procesos (Compartidos)

- [ ] **`frontend/src/components/processes/ProcessCard.jsx`**
  - Card de proceso (usado en requirements, incidents, activities)
  - Muestra: Nombre, Estado, Usuarios asignados, Progreso
  - Indicador de horas estimadas vs usadas
- [ ] **`frontend/src/components/processes/ProcessList.jsx`**
  - Lista de procesos de un requirement/incident/activity
  - Agregar nuevo proceso
  - Expandir para ver actividades del proceso
- [ ] **`frontend/src/components/processes/ProcessForm.jsx`**
  - Formulario crear/editar proceso
  - Asignar usuarios al proceso
  - Estimación de horas
- [ ] **`frontend/src/components/processes/ProcessActivitiesList.jsx`**
  - Lista de actividades dentro de un proceso
  - Mostrar dependencias visualmente
  - Drag & drop para reordenar (opcional en esta fase)
- [ ] **`frontend/src/components/processes/ProcessActivityForm.jsx`**
  - Formulario para actividad de proceso
  - Selector de dependencias (otras actividades)
  - Asignar usuario específico
  - Fechas inicio/fin

#### 5.7 Modificar Componentes Existentes

- [ ] **`frontend/src/pages/ProjectDetail.jsx`** - CAMBIO MAYOR

  ```jsx
  // Agregar Tabs para las 3 secciones
  <Tabs defaultValue="activities">
    <TabsList>
      <TabsTrigger value="activities">Actividades</TabsTrigger>
      <TabsTrigger value="requirements">Requerimientos</TabsTrigger>
      <TabsTrigger value="incidents">Incidentes</TabsTrigger>
    </TabsList>

    <TabsContent value="activities">
      {/* Componente actual de actividades + sub-actividades */}
    </TabsContent>

    <TabsContent value="requirements">
      <RequirementsList projectId={projectId} />
    </TabsContent>

    <TabsContent value="incidents">
      <IncidentsList projectId={projectId} />
    </TabsContent>
  </Tabs>
  ```

- [ ] **`frontend/src/components/projects/ProjectCard.jsx`**
  - Agregar indicador de múltiples áreas
  - Mostrar badges de áreas asignadas
- [ ] **`frontend/src/components/projects/ProjectForm.jsx`**

  - Cambiar selector de área única a multi-select
  - Solo visible para super_admin y admin
  - Validar al menos un área seleccionada

- [ ] **`frontend/src/components/activities/ActivityCard.jsx`**
  - Agregar soporte para sub-actividades
  - Mostrar jerarquía (indentación o tree view)
  - Expandir/colapsar sub-actividades

#### 5.8 Componentes Compartidos/Utilidades

- [ ] **`frontend/src/components/common/StatusBadge.jsx`**
  - Badge reutilizable para estados
  - Colores según tipo: requirement, incident, process, activity
- [ ] **`frontend/src/components/common/PriorityBadge.jsx`**
  - Badge de prioridad (baja, media, alta)
- [ ] **`frontend/src/components/common/SeverityBadge.jsx`**
  - Badge de severidad para incidentes
  - Colores: verde, amarillo, naranja, rojo
- [ ] **`frontend/src/components/common/UserAssignmentSelect.jsx`**
  - Selector de usuarios para asignar
  - Filtrar por área si aplica
  - Multi-select
- [ ] **`frontend/src/components/common/AreaMultiSelect.jsx`**
  - Selector múltiple de áreas
  - Usado en formulario de proyectos

#### 5.9 Hooks Personalizados

- [ ] **`frontend/src/hooks/useRequirements.js`**
  ```js
  export const useRequirements = (projectId) => {
    // Fetch, create, update, delete requirements
    // Estado de loading y errores
  };
  ```
- [ ] **`frontend/src/hooks/useIncidents.js`**
  ```js
  export const useIncidents = (projectId) => {
    // Fetch, create, update, delete incidents
  };
  ```
- [ ] **`frontend/src/hooks/useProcesses.js`**
  ```js
  export const useProcesses = (requirementId, incidentId, activityId) => {
    // Manejo de procesos según contexto
  };
  ```

**Archivos totales a crear/modificar en Fase 5:**

- **Páginas:** 2 nuevas (Requirements, Incidents)
- **API Clients:** 3 nuevos (requirements.js, incidents.js, processes.js), 1 modificar (projects.js)
- **Componentes Requirements:** 4 nuevos
- **Componentes Incidents:** 4 nuevos
- **Componentes Processes:** 5 nuevos
- **Componentes Existentes:** 4 modificar (ProjectDetail, ProjectCard, ProjectForm, ActivityCard)
- **Componentes Comunes:** 5 nuevos
- **Hooks:** 3 nuevos
- **Navegación:** 2 modificar (Layout.jsx, ProtectedRoute.jsx)

**Total:** ~30 archivos nuevos/modificados

---

### **FASE 6: Frontend - Dashboards**

**Orden:** 6️⃣

#### 6.1 Instalar Librería de Gráficos

```bash
cd frontend
pnpm install recharts
# O alternativa: pnpm install chart.js react-chartjs-2
```

#### 6.2 API Clients para Dashboards

- [ ] **`frontend/src/api/dashboard.js`** (nuevo)
  ```js
  export const getSuperAdminMetrics = () => ...
  export const getAdminMetrics = (areaId) => ...
  export const getUserMetrics = (userId) => ...
  export const getAreaStats = (areaId) => ...
  export const getProjectStats = (projectId) => ...
  ```

#### 6.3 Dashboard SuperAdmin

- [ ] **`frontend/src/pages/SuperAdminDashboard.jsx`**
  - Layout con grid de 2-3 columnas
  - Secciones principales:
    1. Resumen global (proyectos totales, usuarios activos, áreas)
    2. Vista por áreas (tabla/cards)
    3. Gráficos de tendencias
    4. Proyectos recientes
- [ ] **`frontend/src/components/dashboard/SuperAdminOverview.jsx`**
  - Cards de métricas principales:
    - Total proyectos (activos/completados)
    - Total usuarios (por rol)
    - Total áreas
    - Horas trabajadas (mes actual)
- [ ] **`frontend/src/components/dashboard/AreaComparisonChart.jsx`**
  - Gráfico de barras comparando áreas
  - Métricas: proyectos, usuarios, horas
  - Filtro por período (semana, mes, año)
- [ ] **`frontend/src/components/dashboard/AreaStatsTable.jsx`**
  - Tabla con stats por área:
    | Área | Proyectos | Usuarios | Disponibles | Ocupados | Horas/Mes |
    - Click en área para ver detalle
- [ ] **`frontend/src/components/dashboard/GlobalProjectsChart.jsx`**
  - Pie chart: Proyectos por estado
  - Line chart: Proyectos creados en últimos 6 meses

#### 6.4 Dashboard Admin (Por Área)

- [ ] **`frontend/src/pages/AdminDashboard.jsx`**
  - Layout similar a SuperAdmin pero filtrado por área
  - Secciones:
    1. Resumen del área
    2. Estado de proyectos del área
    3. Usuarios del área (disponibilidad)
    4. Actividades recientes de usuarios
- [ ] **`frontend/src/components/dashboard/AdminOverview.jsx`**
  - Cards específicas del área:
    - Proyectos del área (activos/completados)
    - Usuarios del área
    - Usuarios disponibles vs ocupados
    - Horas trabajadas (área)
- [ ] **`frontend/src/components/dashboard/AreaProjectsChart.jsx`**
  - Gráficos del área:
    - Proyectos por estado (pie chart)
    - Timeline de proyectos (gantt simplificado)
    - Cumplimiento de deadlines
- [ ] **`frontend/src/components/dashboard/AreaUsersTable.jsx`**
  - Tabla de usuarios del área:
    | Usuario | Estado | Proyectos Asignados | Horas/Semana | Disponibilidad |
  - Indicador visual de carga de trabajo
- [ ] **`frontend/src/components/dashboard/AreaActivitiesTimeline.jsx`**
  - Timeline de actividades recientes
  - Filtro por usuario
  - Últimos 7 días por defecto

#### 6.5 Dashboard Usuario (Mejorado)

- [ ] **`frontend/src/pages/UserDashboard.jsx`** (modificar existente)
  - Agregar sección de procesos asignados
  - Mostrar sub-actividades pendientes
  - Indicador de actividades con dependencias cumplidas
- [ ] **`frontend/src/components/dashboard/UserProcesses.jsx`**
  - Lista de procesos asignados
  - Agrupar por proyecto
  - Progress bar por proceso
- [ ] **`frontend/src/components/dashboard/UserActivitiesChart.jsx`**
  - Gráfico de horas trabajadas (últimas semanas)
  - Distribución por proyecto

#### 6.6 Componentes de Gráficos Reutilizables

- [ ] **`frontend/src/components/charts/BarChart.jsx`**
  - Wrapper de recharts BarChart
  - Props: data, xKey, yKey, colors, title
  - Responsive
- [ ] **`frontend/src/components/charts/LineChart.jsx`**
  - Wrapper de recharts LineChart
  - Soporte para múltiples líneas
  - Tooltip personalizado
- [ ] **`frontend/src/components/charts/PieChart.jsx`**
  - Wrapper de recharts PieChart
  - Leyenda personalizada
  - Colores por categoría
- [ ] **`frontend/src/components/charts/ProgressRing.jsx`**
  - Anillo de progreso circular
  - Usado para % de completitud
- [ ] **`frontend/src/components/charts/HeatmapCalendar.jsx`**
  - Calendario de calor (estilo GitHub)
  - Mostrar actividad diaria de usuarios

#### 6.7 Componentes de Métricas

- [ ] **`frontend/src/components/dashboard/MetricCard.jsx`**
  - Card reutilizable para métricas
  - Props: title, value, icon, trend, color
  - Indicador de aumento/disminución
- [ ] **`frontend/src/components/dashboard/TrendIndicator.jsx`**
  - Flecha arriba/abajo con porcentaje
  - Color según si es positivo/negativo
- [ ] **`frontend/src/components/dashboard/StatBox.jsx`**
  - Box de estadística simple
  - Label + valor + descripción
- [ ] **`frontend/src/components/dashboard/ProgressBar.jsx`**
  - Barra de progreso personalizada
  - Colores según estado
  - Tooltip con detalles

#### 6.8 Layouts y Wrappers

- [ ] **`frontend/src/components/dashboard/DashboardLayout.jsx`**
  - Layout común para todos los dashboards
  - Grid responsive (12 columnas)
  - Secciones colapsables
- [ ] **`frontend/src/components/dashboard/DashboardSection.jsx`**
  - Sección con título y contenido
  - Botón de refresh
  - Estado de loading

#### 6.9 Hooks para Dashboards

- [ ] **`frontend/src/hooks/useDashboardMetrics.js`**
  ```js
  export const useDashboardMetrics = (role, userId, areaId) => {
    // Fetch métricas según rol
    // Auto-refresh cada 5 minutos
    // Cache de datos
  };
  ```
- [ ] **`frontend/src/hooks/useChartData.js`**
  ```js
  export const useChartData = (endpoint, transformFn) => {
    // Fetch y transforma datos para gráficos
    // Manejo de loading y errores
  };
  ```

#### 6.10 Utilidades de Datos

- [ ] **`frontend/src/utils/chartHelpers.js`**
  ```js
  // Funciones para transformar datos de API a formato de gráficos
  export const transformToBarChartData = (data) => ...
  export const transformToPieChartData = (data) => ...
  export const calculateTrend = (current, previous) => ...
  export const formatChartTooltip = (value, name, props) => ...
  ```

**Archivos totales a crear/modificar en Fase 6:**

- **Páginas:** 3 (SuperAdminDashboard, AdminDashboard, modificar UserDashboard)
- **API Clients:** 1 nuevo (dashboard.js)
- **Componentes Dashboard:** 11 nuevos
- **Componentes Gráficos:** 5 nuevos
- **Componentes Métricas:** 4 nuevos
- **Layouts:** 2 nuevos
- **Hooks:** 2 nuevos
- **Utilidades:** 1 nuevo

**Total:** ~29 archivos nuevos/modificados

**Dependencias a instalar:**

```json
{
  "recharts": "^2.10.0"
}
```

---

### **FASE 7: Frontend - Funcionalidades Avanzadas**

**Orden:** 7️⃣

#### 7.1 Sistema de Dependencias Visuales

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

#### 7.2 Drag & Drop

- [ ] Instalar librería: `@dnd-kit/core`, `@dnd-kit/sortable`

  ```bash
  pnpm install @dnd-kit/core @dnd-kit/sortable
  ```

- [ ] **`frontend/src/components/processes/SortableActivityList.jsx`**
  - Lista de actividades con drag & drop
  - Reordenar para cambiar prioridad/orden
  - Animaciones suaves
  - Persistir nuevo orden en backend
- [ ] **`frontend/src/components/projects/ProjectKanban.jsx`**
  - Vista Kanban de procesos
  - Columnas: Por hacer, En progreso, Completado
  - Drag & drop entre columnas (cambia estado)

#### 7.3 Validaciones en Frontend

- [ ] **`frontend/src/utils/dependencyValidator.js`**
  ```js
  export const hasCyclicDependency = (activities, newDep) => ...
  export const canStartActivity = (activity, allActivities) => ...
  export const getBlockedActivities = (activityId, allActivities) => ...
  export const getDependencyChain = (activityId, allActivities) => ...
  ```
- [ ] **`frontend/src/components/processes/DependencyWarning.jsx`**
  - Modal/Alert cuando se intenta agregar dependencia inválida
  - Explicación clara del problema
  - Sugerencias

#### 7.4 Sistema de Notificaciones

- [ ] **`frontend/src/contexts/NotificationContext.jsx`**
  - Context para manejar notificaciones en tiempo real
  - WebSocket o polling para actualizaciones
- [ ] **`frontend/src/components/common/NotificationBell.jsx`**
  - Ícono de campana en header
  - Badge con contador de notificaciones no leídas
  - Dropdown con lista de notificaciones
- [ ] **`frontend/src/components/common/NotificationList.jsx`**
  - Lista de notificaciones
  - Tipos:
    - Dependencia completada → actividad desbloqueada
    - Asignación a nuevo proceso
    - Cambio de estado de proyecto
    - Deadline próximo
- [ ] **`frontend/src/components/common/NotificationItem.jsx`**
  - Item individual de notificación
  - Click para ir al contexto (proyecto, actividad, etc.)
  - Marcar como leída
- [ ] **`frontend/src/api/notifications.js`**
  ```js
  export const getNotifications = (userId) => ...
  export const markAsRead = (notificationId) => ...
  export const markAllAsRead = () => ...
  ```

#### 7.5 Filtros Avanzados

- [ ] **`frontend/src/components/common/AdvancedFilter.jsx`**
  - Panel de filtros colapsable
  - Múltiples criterios:
    - Estado (multi-select)
    - Área (multi-select)
    - Usuario asignado
    - Rango de fechas
    - Prioridad/Severidad
- [ ] **`frontend/src/components/common/FilterChips.jsx`**
  - Chips mostrando filtros activos
  - Click en X para remover filtro
  - "Limpiar todo" button
- [ ] **`frontend/src/hooks/useAdvancedFilter.js`**
  ```js
  export const useAdvancedFilter = (initialData) => {
    // Estado de filtros
    // Aplicar filtros a datos
    // Persistir en localStorage
    // Retornar datos filtrados
  };
  ```

#### 7.6 Búsqueda Global

- [ ] **`frontend/src/components/common/GlobalSearch.jsx`**
  - Barra de búsqueda en header
  - Atajo de teclado (Ctrl+K o Cmd+K)
  - Busca en:
    - Proyectos
    - Requerimientos
    - Incidentes
    - Usuarios
    - Actividades
- [ ] **`frontend/src/components/common/SearchResults.jsx`**
  - Dropdown con resultados agrupados por tipo
  - Preview de cada resultado
  - Click para navegar al item

#### 7.7 Exportación de Datos

- [ ] **`frontend/src/components/common/ExportButton.jsx`**
  - Botón con dropdown de formatos
  - Formatos: CSV, Excel, PDF
- [ ] **`frontend/src/utils/exportHelpers.js`**
  ```js
  export const exportToCSV = (data, filename) => ...
  export const exportToExcel = (data, filename) => ...
  export const exportToPDF = (data, filename) => ...
  ```
- [ ] Instalar librerías:
  ```bash
  pnpm install xlsx jspdf jspdf-autotable
  ```

#### 7.8 Vista de Timeline/Gantt

- [ ] **`frontend/src/components/projects/ProjectTimeline.jsx`**
  - Timeline visual de procesos y actividades
  - Vista Gantt simplificada
  - Mostrar dependencias
  - Drag para ajustar fechas (si tiene permiso)
- [ ] Librería sugerida:
  ```bash
  pnpm install gantt-schedule-timeline-calendar
  # O alternativa: pnpm install frappe-gantt
  ```

#### 7.9 Comentarios y Colaboración

- [ ] **`frontend/src/components/common/CommentSection.jsx`** (mejorar existente)
  - Agregar a Requirements, Incidents, Processes
  - Menciones de usuarios (@usuario)
  - Adjuntar archivos
  - Markdown support
- [ ] **`frontend/src/components/common/ActivityFeed.jsx`**
  - Feed de actividades del proyecto
  - Cambios de estado, asignaciones, comentarios
  - Timeline vertical

#### 7.10 Permisos y Restricciones Visuales

- [ ] **`frontend/src/hooks/usePermissions.js`**
  ```js
  export const usePermissions = () => {
    const { user } = useAuth();
    return {
      canCreateProject: user.role === "super_admin" || user.role === "admin",
      canDeleteProject: user.role === "super_admin",
      canAssignUsers: user.role !== "user",
      canViewAllAreas: user.role === "super_admin",
      // ... más permisos
    };
  };
  ```
- [ ] **`frontend/src/components/common/PermissionGate.jsx`**
  - HOC para condicionar renderizado
  ```jsx
  <PermissionGate requires="canCreateProject">
    <Button>Crear Proyecto</Button>
  </PermissionGate>
  ```

#### 7.11 Responsive y Mobile

- [ ] Ajustar todos los dashboards para mobile
- [ ] Componentes de gráficos responsive
- [ ] Navegación hamburger en mobile
- [ ] Touch gestures para drag & drop en mobile

#### 7.12 Optimizaciones de UX

- [ ] **Skeleton loaders** para carga de datos
- [ ] **Infinite scroll** para listas largas
- [ ] **Debounce** en búsquedas y filtros
- [ ] **Optimistic updates** (actualizar UI antes de confirmar backend)
- [ ] **Error boundaries** para capturar errores de React

**Archivos totales a crear/modificar en Fase 7:**

- **Dependencias:** 7 nuevos componentes
- **Drag & Drop:** 3 nuevos componentes
- **Validaciones:** 2 archivos nuevos
- **Notificaciones:** 5 nuevos componentes + API
- **Filtros:** 3 nuevos componentes + hook
- **Búsqueda:** 2 nuevos componentes
- **Exportación:** 1 componente + utilidades
- **Timeline:** 1 componente
- **Colaboración:** 2 componentes mejorados
- **Permisos:** 1 hook + 1 HOC
- **Optimizaciones:** Ajustes transversales

**Total:** ~30 archivos nuevos/modificados

**Dependencias a instalar:**

```json
{
  "@dnd-kit/core": "^6.0.0",
  "@dnd-kit/sortable": "^8.0.0",
  "react-flow-renderer": "^10.3.0",
  "xlsx": "^0.18.5",
  "jspdf": "^2.5.1",
  "jspdf-autotable": "^3.8.0",
  "gantt-schedule-timeline-calendar": "^3.0.0"
}
```

---

### **FASE 8: Testing y Ajustes**

**Orden:** 8️⃣

- [ ] Testing de endpoints
- [ ] Testing de permisos
- [ ] Testing de dependencias
- [ ] Ajustes de performance
- [ ] Documentación API actualizada

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
