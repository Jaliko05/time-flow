# Time Flow - Refactorización y Mejoras

## 📋 Resumen de Cambios Implementados

### Backend - Nuevos Modelos y Funcionalidades

#### 1. **Modelo Task** (✅ Completado)

Se creó el modelo completo de tareas con:

- Estados: `backlog`, `assigned`, `in_progress`, `paused`, `completed`
- Prioridades: `low`, `medium`, `high`, `urgent`
- Seguimiento de horas: estimadas, usadas, restantes
- Porcentaje de completitud automático
- Relación con proyectos y usuarios asignados
- Fechas de inicio, fin y límite

**Archivo**: `backend/models/task.go`

#### 2. **Modelo Activity Mejorado** (✅ Completado)

Se actualizó para soportar:

- Vinculación con tareas (`task_id`)
- Nombre de tarea (`task_name`)
- ID de evento de calendario de Microsoft (`calendar_event_id`)
- Relación con el modelo Task

**Archivo**: `backend/models/activity.go`

#### 3. **Modelo Project Mejorado** (✅ Completado)

- Relación con tareas (`Tasks []Task`)
- Métodos para actualizar horas usadas automáticamente
- Cálculo de progreso basado en actividades

**Archivo**: `backend/models/project.go`

#### 4. **Handlers de Tasks** (✅ Completado)

Endpoints completos para gestión de tareas:

- `GET /api/v1/tasks` - Listar tareas (filtros por rol)
- `GET /api/v1/tasks/:id` - Detalle de tarea
- `POST /api/v1/tasks` - Crear tarea
- `PUT /api/v1/tasks/:id` - Actualizar tarea
- `PATCH /api/v1/tasks/:id/status` - Cambiar estado
- `PATCH /api/v1/tasks/bulk-order` - Reordenar múltiples tareas
- `DELETE /api/v1/tasks/:id` - Eliminar tarea

**Archivo**: `backend/handlers/tasks.go`

#### 5. **Handlers de Activities Mejorados** (✅ Completado)

- Soporte para registrar actividades vinculadas a tareas
- Actualización automática de horas en tareas y proyectos
- Validación de permisos mejorada

**Archivo**: `backend/handlers/activities.go`

#### 6. **Rutas Actualizadas** (✅ Completado)

Se agregaron todas las rutas de tasks al router.

**Archivo**: `backend/routes/routes.go`

#### 7. **Migración de Base de Datos** (✅ Completado)

Se agregó el modelo Task al AutoMigrate.

**Archivo**: `backend/config/database.go`

### Frontend - Nuevos Componentes y Páginas

#### 1. **API Cliente de Tasks** (✅ Completado)

Cliente completo para interactuar con el backend de tasks.

**Archivo**: `frontend/src/api/tasks.js`

#### 2. **Componente TaskFormDialog** (✅ Completado)

Formulario para crear y editar tareas con:

- Campos de nombre, descripción
- Selector de prioridad
- Horas estimadas
- Asignación de usuario
- Fecha límite

**Archivo**: `frontend/src/components/tasks/TaskFormDialog.jsx`

#### 3. **Componente TaskKanban** (✅ Completado)

Vista Kanban completa para tareas con:

- 5 columnas por estado
- Tarjetas de tarea con información detallada
- Cambio de estado con menú contextual
- Indicadores de progreso
- Alertas de tareas vencidas
- Badges de prioridad y usuario asignado

**Archivo**: `frontend/src/components/tasks/TaskKanban.jsx`

#### 4. **Página ProjectDetail** (✅ Completado)

Vista detallada de proyecto con:

- Estadísticas del proyecto (horas, progreso)
- Información del proyecto y asignaciones
- Resumen de tareas
- Kanban board integrado
- Navegación mejorada

**Archivo**: `frontend/src/pages/ProjectDetail.jsx`

#### 5. **Rutas Actualizadas** (✅ Completado)

- Ruta `/Projects/:id` para detalles de proyecto
- Navegación desde lista de proyectos

**Archivo**: `frontend/src/pages/index.jsx`

#### 6. **ProjectList Mejorado** (✅ Completado)

- Botón para ver detalles del proyecto
- Navegación al detalle con `useNavigate`

**Archivo**: `frontend/src/components/projects/ProjectList.jsx`

---

## 🎯 Funcionalidades por Rol

### SuperAdmin

- ✅ Ve todos los proyectos, tareas y actividades del sistema
- ✅ Puede crear áreas y asignar administradores
- ✅ Acceso completo a estadísticas globales
- ✅ Gestión de usuarios de todas las áreas

### Admin (Admin de Área)

- ✅ Ve proyectos y tareas de su área
- ✅ Puede crear proyectos de área
- ✅ Asigna proyectos y tareas a usuarios de su área
- ✅ Ve actividades de todos los usuarios de su área
- ✅ Acceso a estadísticas de su área

### User (Usuario de Área)

- ✅ Ve solo sus proyectos y tareas asignadas
- ✅ Puede crear proyectos personales
- ✅ Registra actividades diarias
- ✅ Puede vincular actividades a proyectos/tareas asignadas
- ✅ Ve su propio calendario y estadísticas

---

## 📊 Flujo de Trabajo del Sistema

### 1. Gestión de Proyectos

1. **SuperAdmin o Admin** crea un proyecto de área
2. Asigna el proyecto a un usuario del área
3. Proyecto cambia a estado `assigned`
4. Usuario asignado puede ver el proyecto en su backlog

### 2. Gestión de Tareas

1. **Admin** crea tareas dentro del proyecto
2. Asigna tareas a usuarios específicos
3. Usuario ve tareas en su Kanban board
4. Usuario cambia estado: `backlog` → `assigned` → `in_progress` → `completed`
5. Puede pausar tareas (`paused`)

### 3. Registro de Actividades

1. **Usuario** registra actividades diarias
2. Puede vincular actividad a:
   - Un proyecto en progreso
   - Una tarea específica en progreso
   - Reunión de calendario (próxima implementación)
3. Sistema actualiza automáticamente:
   - Horas usadas en la tarea
   - Horas usadas en el proyecto
   - Porcentaje de completitud

### 4. Seguimiento y Control

- **Usuarios**: Ven su progreso diario y semanal
- **Admins**: Monitorean progreso de su área
- **SuperAdmin**: Vista global de toda la organización

---

## 🚀 Próximos Pasos Recomendados

### Alta Prioridad

#### 1. **Mejorar Dashboards según Roles** (⏳ Pendiente)

- **UserDashboard**: Agregar sección de "Mis Tareas" con Kanban
- **AdminDashboard**: Agregar estadísticas de proyectos y tareas del área
- **SuperAdminDashboard**: Panel con métricas globales

**Archivos a modificar**:

- `frontend/src/components/dashboard/UserDashboard.jsx`
- `frontend/src/components/dashboard/AdminDashboard.jsx`
- `frontend/src/components/dashboard/SuperAdminDashboard.jsx`

#### 2. **Integrar Reuniones de Calendario como Actividades** (⏳ Pendiente)

Permitir que el usuario convierta eventos de Microsoft Calendar en actividades.

**Implementación sugerida**:

```jsx
// En CalendarEvents.jsx
- Agregar botón "Registrar como actividad" en cada evento
- Pre-llenar formulario de actividad con:
  - Nombre del evento
  - Duración del evento
  - Tipo: "teams" o "sesion"
  - calendar_event_id para evitar duplicados
```

**Archivos**:

- `frontend/src/components/calendar/CalendarEvents.jsx`
- `backend/handlers/calendar.go` (validar que no exista actividad con ese event_id)

#### 3. **Actualizar QuickActivityForm** (⏳ Pendiente)

Agregar selector de tareas además de proyectos.

**Implementación**:

```jsx
// En QuickActivityForm.jsx
- Cuando se selecciona un proyecto, cargar sus tareas
- Permitir seleccionar una tarea específica
- Auto-completar task_name cuando se selecciona tarea
```

#### 4. **Mejorar Validaciones de Permisos**

Asegurar que:

- ✅ Usuarios solo puedan registrar actividades en tareas asignadas
- ✅ Admins solo puedan asignar tareas a usuarios de su área
- ⏳ Validar que proyecto y tarea pertenezcan a la misma área

### Media Prioridad

#### 5. **Notificaciones y Alertas**

- Tareas próximas a vencer
- Tareas vencidas
- Proyectos con sobrecarga de horas

#### 6. **Reportes y Exportación**

- Exportar actividades a Excel/PDF
- Reportes de productividad por usuario
- Reportes de tiempo por proyecto

#### 7. **Mejoras de UX**

- Drag & drop real en Kanban (react-beautiful-dnd)
- Filtros avanzados en listas
- Búsqueda global
- Dark mode completo

### Baja Prioridad

#### 8. **Funcionalidades Avanzadas**

- Comentarios en tareas
- Archivos adjuntos
- Historial de cambios
- Subtareas
- Etiquetas personalizadas

---

## 🔧 Comandos para Ejecutar

### Backend

```powershell
cd backend
go mod tidy
go run main.go
```

### Frontend

```powershell
cd frontend
pnpm install
pnpm dev
```

### Base de Datos

La migración automática creará las nuevas tablas al iniciar el backend.

---

## 📝 Estructura de Permisos

| Funcionalidad               | User | Admin | SuperAdmin |
| --------------------------- | ---- | ----- | ---------- |
| Ver sus propias actividades | ✅   | ✅    | ✅         |
| Ver actividades de su área  | ❌   | ✅    | ✅         |
| Ver todas las actividades   | ❌   | ❌    | ✅         |
| Crear proyecto personal     | ✅   | ✅    | ✅         |
| Crear proyecto de área      | ❌   | ✅    | ✅         |
| Asignar proyecto a usuario  | ❌   | ✅\*  | ✅         |
| Crear tarea en proyecto     | ❌   | ✅\*  | ✅         |
| Asignar tarea a usuario     | ❌   | ✅\*  | ✅         |
| Cambiar estado de su tarea  | ✅   | ✅    | ✅         |
| Eliminar tarea              | ❌   | ✅\*  | ✅         |
| Ver estadísticas de área    | ❌   | ✅\*  | ✅         |
| Ver estadísticas globales   | ❌   | ❌    | ✅         |
| Gestionar usuarios          | ❌   | ✅\*  | ✅         |
| Gestionar áreas             | ❌   | ❌    | ✅         |

\* Solo dentro de su área asignada

---

## 🐛 Consideraciones y Bugs Conocidos

### Validaciones Pendientes

1. Verificar que al eliminar un proyecto se manejen correctamente las tareas asociadas
2. Validar que no se puedan crear actividades con horas negativas
3. Prevenir la asignación de tareas a usuarios fuera del área del proyecto

### Optimizaciones

1. Agregar índices en base de datos para consultas frecuentes
2. Implementar paginación en listas largas
3. Cachear consultas de proyectos y tareas activas

---

## 📚 Documentación de API

La documentación completa de la API está disponible en:

```
http://localhost:8080/swagger/index.html
```

Endpoints principales de Tasks:

- `GET /api/v1/tasks` - Listar tareas
- `POST /api/v1/tasks` - Crear tarea
- `GET /api/v1/tasks/:id` - Detalle de tarea
- `PUT /api/v1/tasks/:id` - Actualizar tarea
- `PATCH /api/v1/tasks/:id/status` - Cambiar estado
- `DELETE /api/v1/tasks/:id` - Eliminar tarea

---

## ✅ Checklist de Testing

### Backend

- [ ] Crear proyecto como Admin
- [ ] Asignar proyecto a usuario del área
- [ ] Crear tarea en proyecto
- [ ] Asignar tarea a usuario
- [ ] Cambiar estado de tarea
- [ ] Registrar actividad vinculada a tarea
- [ ] Verificar actualización de horas en tarea y proyecto
- [ ] Probar permisos de Admin (no puede acceder a otras áreas)
- [ ] Probar permisos de Usuario (no puede crear tareas)

### Frontend

- [ ] Vista de lista de proyectos
- [ ] Navegación a detalle de proyecto
- [ ] Vista Kanban de tareas
- [ ] Crear nueva tarea desde Kanban
- [ ] Editar tarea existente
- [ ] Cambiar estado de tarea con menú
- [ ] Registrar actividad desde quick form
- [ ] Ver actividades vinculadas a tarea
- [ ] Dashboard según rol

---

## 🎨 Mejoras de UI Implementadas

1. **Kanban Board**:

   - Diseño limpio con 5 columnas
   - Códigos de color por estado
   - Badges de prioridad
   - Indicadores visuales de progreso
   - Alertas de tareas vencidas

2. **ProjectDetail**:

   - Tarjetas de estadísticas
   - Barra de progreso visual
   - Información organizada
   - Navegación intuitiva

3. **TaskCard**:
   - Diseño compacto
   - Información esencial visible
   - Acciones rápidas en menú
   - Indicadores de estado

---

## 🔐 Seguridad

- ✅ Autenticación OAuth 2.0 con Microsoft
- ✅ Tokens JWT para autenticación
- ✅ Validación de permisos por rol en cada endpoint
- ✅ Validación de área en operaciones de Admin
- ✅ Soft delete en modelos principales

---

## 📞 Soporte

Para consultas o problemas:

1. Revisar los logs del backend en consola
2. Verificar la consola del navegador para errores de frontend
3. Consultar la documentación de Swagger para detalles de API

---

**Última actualización**: Diciembre 2024
**Versión**: 2.0
