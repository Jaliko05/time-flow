# Refactorización Frontend - Time Flow

## 📋 Resumen de Cambios

Se ha refactorizado el código del frontend para mejorar la **mantenibilidad**, **legibilidad** y **reutilización** de componentes, manteniendo toda la funcionalidad existente.

## 🗂️ Nueva Estructura

### 1. **Constantes Centralizadas** (`src/constants/index.js`)

- `STATUS_CONFIG`: Configuración de estados de proyectos/tareas
- `PRIORITY_CONFIG`: Configuración de prioridades con iconos
- `TASK_COLUMNS`: Definición de columnas del Kanban
- `ROLE_CONFIG`: Configuración de roles de usuario
- `PROJECT_TYPES`: Tipos de proyecto disponibles
- `ACTIVE_PROJECT_STATUSES`: Estados que permiten registro de actividades

**Beneficio**: Una única fuente de verdad para configuraciones, fácil de mantener y actualizar.

### 2. **Hooks Personalizados** (`src/hooks/`)

#### `useProjects.js`

- `useProjects(user)`: Gestión completa de proyectos con filtros por rol
- `useUserProjects(user)`: Proyectos específicos de usuario (personales + asignados)

**Características**:

- Manejo automático de queries con TanStack Query
- Mutations integradas (create, update, delete)
- Toast notifications automáticas
- Estados de loading unificados

**Uso**:

```javascript
const { projects, isLoading, createProject, updateProject, deleteProject } =
  useProjects(user);
```

### 3. **Utilidades** (`src/utils/helpers.js`)

Funciones puras y reutilizables:

- `filterActiveProjects(projects)`: Filtra proyectos activos
- `calculateProjectProgress(project)`: Calcula porcentaje de progreso
- `isOverdue(date)`: Verifica si una fecha está vencida
- `getTaskCountByStatus(tasks)`: Cuenta tareas por estado
- `calculateUserStats(users)`: Estadísticas agregadas de usuarios
- `calculateProjectStats(projects)`: Estadísticas agregadas de proyectos

### 4. **Componentes Comunes Reutilizables** (`src/components/common/`)

#### `StatCard.jsx`

Tarjeta de estadística reutilizable con soporte para:

- Icono personalizable
- Título y valor
- Descripción opcional
- Tendencia (up/down/neutral)

```javascript
<StatCard
  title="Total Proyectos"
  value={25}
  icon={<FolderKanban />}
  trend="up"
/>
```

#### `EmptyState.jsx`

Estado vacío genérico para listas/tablas:

```javascript
<EmptyState
  icon={<ListTodo className="h-12 w-12" />}
  title="No hay datos"
  description="Crea tu primer elemento"
  action={<Button>Crear</Button>}
/>
```

#### `Loader.jsx`

Spinner centralizado con tamaños configurables:

```javascript
<Loader size="lg" text="Cargando datos..." />
```

#### `Badges.jsx`

Badges especializados:

- `StatusBadge`: Badge de estado con colores automáticos
- `PriorityBadge`: Badge de prioridad con iconos
- `CustomBadge`: Badge personalizable

```javascript
<StatusBadge status="in_progress" />
<PriorityBadge priority="high" showIcon />
```

#### `PageHeader.jsx`

Encabezado de página consistente:

```javascript
<PageHeader
  title="Mis Proyectos"
  subtitle="Gestiona tus proyectos y tareas"
  actions={<Button>Nuevo</Button>}
  icon={<FolderKanban />}
/>
```

### 5. **Componentes Específicos Refactorizados**

#### `ActiveProjectsList.jsx`

Componente dedicado para mostrar proyectos activos donde se pueden registrar actividades.

#### `ProjectCard.jsx`

Tarjeta individual de proyecto con:

- Barra de color superior
- Badges de estado y prioridad
- Barra de progreso
- Metadatos (horas, tareas, usuario asignado)
- Acciones (ver, editar, eliminar)

#### `TaskCard.jsx`

Tarjeta individual de tarea para el Kanban:

- Drag & drop nativo
- Prioridad visual
- Metadata (usuario, horas, fecha)
- Indicador de tareas vencidas

#### `TaskColumn.jsx`

Columna del Kanban:

- Drop zone para drag & drop
- Contador de tareas
- Botón para crear tarea
- Estado vacío

## 📦 Componentes Refactorizados

### `UserDashboard.jsx`

**Antes**: 206 líneas con lógica mezclada
**Después**: ~140 líneas, usa:

- `useUserProjects` hook
- `PageHeader` component
- `EmptyState` component
- `ActiveProjectsList` component

**Mejoras**:

- Lógica de negocio separada en hooks
- Componentes UI reutilizables
- Código más legible y mantenible

### `Projects.jsx`

**Antes**: 148 líneas con queries y mutations manuales
**Después**: ~120 líneas, usa:

- `useProjects` hook
- `PageHeader` component
- Funciones helper para títulos dinámicos

**Mejoras**:

- Sin código repetitivo de TanStack Query
- Manejo centralizado de errores
- Callbacks onSuccess más limpios

### `ProjectList.jsx`

**Antes**: 228 líneas con configuraciones inline
**Después**: ~40 líneas, usa:

- `ProjectCard` component
- `EmptyState` component
- Configuraciones desde `constants`

**Mejoras**:

- Separación de responsabilidades
- Componentes más pequeños y testeables
- Fácil agregar nuevas features a ProjectCard

### `TaskBoard.jsx`

**Antes**: 305 líneas monolíticas
**Después**: ~70 líneas principales, usa:

- `TaskColumn` component (separado)
- `TaskCard` component (separado)
- `TASK_COLUMNS` desde constantes
- `Loader` component

**Mejoras**:

- TaskCard reutilizable en otros contextos
- TaskColumn independiente
- Más fácil testear drag & drop

## 🎯 Beneficios de la Refactorización

### 1. **Mantenibilidad**

- ✅ Componentes pequeños y enfocados
- ✅ Separación clara de responsabilidades
- ✅ Fácil localizar y corregir bugs

### 2. **Reutilización**

- ✅ Componentes comunes usables en todo el proyecto
- ✅ Hooks personalizados para lógica compartida
- ✅ Utilidades puras y testeables

### 3. **Legibilidad**

- ✅ Código autodocumentado
- ✅ JSDoc en funciones principales
- ✅ Nombres descriptivos y consistentes

### 4. **Escalabilidad**

- ✅ Fácil agregar nuevos componentes
- ✅ Estructura clara para nuevos desarrolladores
- ✅ Patterns consistentes en todo el proyecto

### 5. **Testing**

- ✅ Componentes más pequeños = más fáciles de testear
- ✅ Funciones puras en utilities
- ✅ Hooks aislados

## 🔄 Funcionalidad Preservada

**Garantía**: Toda la funcionalidad existente se mantiene **exactamente igual**:

- ✅ Microsoft Planner completo (Kanban, tareas, comentarios)
- ✅ Sistema de roles (user, admin, superadmin)
- ✅ Proyectos personales + asignados para usuarios
- ✅ Drag & drop de tareas
- ✅ Filtros por área para admins
- ✅ Estadísticas por área para superadmin
- ✅ Fechas de inicio/fin en proyectos
- ✅ Prioridades en proyectos y tareas

## 🚀 Próximos Pasos Sugeridos

1. **Testing**: Agregar tests unitarios para hooks y utilidades
2. **Storybook**: Documentar componentes comunes visualmente
3. **TypeScript**: Migrar gradualmente para mayor type-safety
4. **Performance**: Implementar React.memo donde sea necesario
5. **Accesibilidad**: Agregar ARIA labels y keyboard navigation

## 📝 Guía de Uso

### Crear un nuevo componente común:

```javascript
// src/components/common/MiComponente.jsx
export function MiComponente({ prop1, prop2 }) {
  return (
    // ...
  );
}

// Agregarlo al index.js
export { MiComponente } from "./MiComponente";
```

### Usar un hook personalizado:

```javascript
import { useProjects } from "@/hooks/useProjects";

function MiComponente() {
  const { projects, createProject, isLoading } = useProjects(user);
  // ...
}
```

### Usar constantes:

```javascript
import { STATUS_CONFIG, PRIORITY_CONFIG } from "@/constants";

const statusLabel = STATUS_CONFIG[project.status].label;
```

## 📚 Archivos Principales

```
frontend/src/
├── constants/
│   └── index.js                    # Configuraciones centralizadas
├── hooks/
│   └── useProjects.js              # Hooks de proyectos
├── utils/
│   └── helpers.js                  # Funciones utilitarias
├── components/
│   ├── common/                     # Componentes reutilizables
│   │   ├── index.js
│   │   ├── StatCard.jsx
│   │   ├── EmptyState.jsx
│   │   ├── Loader.jsx
│   │   ├── Badges.jsx
│   │   └── PageHeader.jsx
│   ├── dashboard/
│   │   ├── UserDashboard.jsx       # Refactorizado
│   │   └── ActiveProjectsList.jsx  # Nuevo componente
│   ├── projects/
│   │   ├── ProjectList.jsx         # Refactorizado
│   │   └── ProjectCard.jsx         # Nuevo componente
│   └── tasks/
│       ├── TaskBoard.jsx           # Refactorizado
│       ├── TaskCard.jsx            # Nuevo componente
│       └── TaskColumn.jsx          # Nuevo componente
└── pages/
    └── Projects.jsx                # Refactorizado
```

---

**Versión**: 1.0  
**Fecha**: Diciembre 2025  
**Manteniendo la funcionalidad, mejorando el código** ✨
