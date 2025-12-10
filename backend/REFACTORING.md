# Refactorización Backend - Time Flow

## 📋 Resumen de Cambios

Se ha refactorizado el código del backend para mejorar la **mantenibilidad**, **reutilización** y **separación de responsabilidades**, siguiendo principios SOLID y arquitectura limpia.

## 🗂️ Nueva Estructura

### 1. **Constantes Centralizadas** (`backend/constants/`)

**`constants.go`**

- Constantes de roles, estados, prioridades
- Códigos HTTP reutilizables
- Mensajes de error y éxito estandarizados

**Beneficios**:

- Una única fuente de verdad
- Fácil mantenimiento
- Consistencia en respuestas

**Antes**:

```go
// Esparcido en múltiples archivos
const (
	ProjectStatusUnassigned ProjectStatus = "unassigned"
	// ...
)
```

**Después**:

```go
import "github.com/jaliko05/time-flow/constants"

status := constants.ProjectStatusInProgress
```

### 2. **Helpers** (`backend/helpers/`)

Funciones utilitarias reutilizables:

**Parsing**:

- `ParseUintParam(param string)`: Convierte string a uint
- `ParseBoolParam(param string)`: Convierte string a bool
- `ParseDateParam(param string)`: Convierte string a time.Time

**Cálculos**:

- `CalculateProjectMetrics(estimated, used float64)`: Calcula horas restantes y porcentaje

**Autorización**:

- `IsAuthorizedForProject(userID, role, areaID, project)`: Verifica permisos
- `IsAuthorizedForActivity(userID, role, areaID, activity)`: Verifica permisos

**Punteros**:

- `PointerToUint/Float/Bool/String`: Crea punteros
- `DerefUint/Float/Bool/String`: Desreferencia segura con valores por defecto

**Formato**:

- `FormatMonth(date)`: Formatea fecha a YYYY-MM

### 3. **Services** (`backend/services/`)

Capa de servicios para lógica de negocio:

#### **ProjectService** (`project_service.go`)

Responsabilidades:

- CRUD de proyectos
- Filtros y búsquedas
- Actualización de métricas
- Cálculo de horas utilizadas

**Métodos**:

```go
service := services.NewProjectService()

// Obtener proyectos con filtros
projects, err := service.GetProjects(filters)

// Obtener proyecto por ID con relaciones
project, err := service.GetProjectByID(id)

// Crear proyecto
err := service.CreateProject(&project)

// Actualizar proyecto
err := service.UpdateProject(id, updates)

// Eliminar proyecto
err := service.DeleteProject(id)

// Actualizar horas usadas
err := service.UpdateProjectUsedHours(projectID)
```

#### **ActivityService** (`activity_service.go`)

Responsabilidades:

- CRUD de actividades
- Filtros complejos (fecha, mes, área, usuario)
- Cálculo de estadísticas
- Actualización automática de mes

**Métodos**:

```go
service := services.NewActivityService()

// Obtener actividades con filtros
activities, err := service.GetActivities(filters)

// Obtener actividad por ID
activity, err := service.GetActivityByID(id)

// Crear actividad (automáticamente setea el mes)
err := service.CreateActivity(&activity)

// Actualizar actividad
err := service.UpdateActivity(id, updates)

// Eliminar actividad
err := service.DeleteActivity(id)

// Obtener estadísticas
stats, err := service.GetActivityStats(filters)
```

## 🎯 Mejoras Implementadas

### 1. **Separación de Responsabilidades**

**Antes** (en handlers):

```go
func GetProjects(c *gin.Context) {
    // 100+ líneas mezclando:
    // - Parsing de parámetros
    // - Lógica de autorización
    // - Queries a la DB
    // - Formateo de respuesta
}
```

**Después**:

```go
func GetProjects(c *gin.Context) {
    // 1. Parse parámetros (helpers)
    filters := buildProjectFilters(c)

    // 2. Lógica de negocio (service)
    projects, err := projectService.GetProjects(filters)

    // 3. Respuesta (utils)
    utils.SuccessResponse(c, 200, "Projects retrieved", projects)
}
```

### 2. **Reutilización de Código**

**Helpers reutilizables**:

```go
// Antes: código duplicado en cada handler
userIDStr := c.Query("user_id")
if userIDStr != "" {
    userID, err := strconv.ParseUint(userIDStr, 10, 32)
    if err != nil {
        // manejo de error
    }
}

// Después: una línea
userID, err := helpers.ParseUintParam(c.Query("user_id"))
```

**Autorización centralizada**:

```go
// Antes: lógica repetida
if userRole == "user" && project.CreatedBy != userID {
    c.JSON(403, gin.H{"error": "Forbidden"})
    return
}

// Después: función reutilizable
if !helpers.IsAuthorizedForProject(userID, userRole, userAreaID, project) {
    utils.ErrorResponse(c, 403, constants.ErrForbidden)
    return
}
```

### 3. **Testabilidad**

**Services desacoplados**:

```go
// Fácil de mockear para testing
type ProjectService interface {
    GetProjects(filters map[string]interface{}) ([]models.Project, error)
    GetProjectByID(id uint) (*models.Project, error)
    // ...
}

// Tests
func TestGetProjects(t *testing.T) {
    mockService := &MockProjectService{}
    // Test sin DB real
}
```

### 4. **Manejo de Errores Consistente**

**Constantes de error**:

```go
// Antes: strings mágicos
c.JSON(404, gin.H{"error": "Project not found"})

// Después: constantes
utils.ErrorResponse(c, constants.StatusNotFound, constants.ErrNotFound)
```

### 5. **Validación y Parsing**

**Helpers de parsing seguro**:

```go
// Manejo automático de valores nil
userID := helpers.DerefUint(req.UserID, 0)
isActive := helpers.DerefBool(req.IsActive, true)
```

## 📦 Estructura del Proyecto

```
backend/
├── constants/
│   └── constants.go              # Constantes centralizadas
├── helpers/
│   └── helpers.go                # Funciones utilitarias
├── services/
│   ├── project_service.go        # Lógica de negocio de proyectos
│   ├── activity_service.go       # Lógica de negocio de actividades
│   ├── task_service.go           # (Próximo: tareas)
│   └── user_service.go           # (Próximo: usuarios)
├── handlers/
│   ├── projects.go               # Endpoints HTTP (refactorizado)
│   ├── activities.go             # Endpoints HTTP (refactorizado)
│   ├── tasks.go
│   ├── users.go
│   ├── auth.go
│   ├── stats.go
│   └── ...
├── models/
│   ├── project.go
│   ├── activity.go
│   ├── task.go
│   └── user.go
├── middleware/
│   ├── auth.go
│   ├── authorization.go
│   └── cors.go
├── utils/
│   ├── response.go               # Respuestas HTTP estandarizadas
│   ├── jwt.go
│   ├── calendar.go
│   └── microsoft.go
├── config/
│   └── database.go
├── routes/
│   └── routes.go
└── main.go                       # Entry point limpio
```

## 🚀 Próximos Pasos

### Fase 2 - Servicios Adicionales:

- [ ] `TaskService` - Lógica de tareas
- [ ] `UserService` - Lógica de usuarios
- [ ] `StatsService` - Cálculos de estadísticas
- [ ] `AuthService` - Autenticación y autorización

### Fase 3 - Refactorización de Handlers:

- [ ] Actualizar `projects.go` para usar ProjectService
- [ ] Actualizar `activities.go` para usar ActivityService
- [ ] Actualizar `tasks.go` para usar TaskService
- [ ] Actualizar `users.go` para usar UserService

### Fase 4 - Testing:

- [ ] Unit tests para services
- [ ] Unit tests para helpers
- [ ] Integration tests para handlers
- [ ] Mock database para testing

### Fase 5 - Optimizaciones:

- [ ] Caching (Redis)
- [ ] Rate limiting
- [ ] Request validation middleware
- [ ] Logging estructurado

## 📝 Guía de Uso

### Crear un nuevo Service:

```go
// services/example_service.go
package services

import (
    "github.com/jaliko05/time-flow/config"
    "gorm.io/gorm"
)

type ExampleService struct {
    db *gorm.DB
}

func NewExampleService() *ExampleService {
    return &ExampleService{db: config.DB}
}

func (s *ExampleService) GetAll() ([]Model, error) {
    var items []Model
    err := s.db.Find(&items).Error
    return items, err
}
```

### Usar Helpers:

```go
// En un handler
func MyHandler(c *gin.Context) {
    // Parsing seguro
    id, err := helpers.ParseUintParam(c.Param("id"))
    if err != nil {
        utils.ErrorResponse(c, constants.StatusBadRequest, constants.ErrInvalidInput)
        return
    }

    // Verificar autorización
    if !helpers.IsAuthorizedForProject(userID, userRole, userAreaID, project) {
        utils.ErrorResponse(c, constants.StatusForbidden, constants.ErrForbidden)
        return
    }

    // Uso de constantes
    utils.SuccessResponse(c, constants.StatusOK, constants.MsgRetrievedSuccessfully, data)
}
```

### Usar Services:

```go
// En un handler
func GetProjectsHandler(c *gin.Context) {
    service := services.NewProjectService()

    // Construir filtros
    filters := map[string]interface{}{
        "area_id": areaID,
        "is_active": true,
    }

    // Llamar al service
    projects, err := service.GetProjects(filters)
    if err != nil {
        utils.ErrorResponse(c, constants.StatusInternalServerError, constants.ErrDatabaseOperation)
        return
    }

    utils.SuccessResponse(c, constants.StatusOK, constants.MsgRetrievedSuccessfully, projects)
}
```

## ✨ Beneficios de la Refactorización

### 1. **Mantenibilidad** ⭐⭐⭐⭐⭐

- Código más limpio y organizado
- Fácil localizar funcionalidad
- Cambios en un solo lugar

### 2. **Reutilización** ⭐⭐⭐⭐⭐

- Helpers usables en toda la aplicación
- Services compartidos
- Menos código duplicado

### 3. **Testabilidad** ⭐⭐⭐⭐⭐

- Services fáciles de testear
- Helpers con funciones puras
- Mock fácil de implementar

### 4. **Escalabilidad** ⭐⭐⭐⭐⭐

- Arquitectura clara
- Fácil agregar features
- Separación de capas

### 5. **Seguridad** ⭐⭐⭐⭐

- Validaciones centralizadas
- Autorización consistente
- Manejo de errores robusto

---

**Versión**: 1.0  
**Fecha**: Diciembre 2025  
**Código más limpio, más robusto, más mantenible** ✨
