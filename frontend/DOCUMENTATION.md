# Frontend Documentation - Time Flow

Aplicación React moderna para el sistema de gestión de tiempo Time Flow, construida con Vite, React Router, TanStack Query y Shadcn/ui.

---

## 📋 Tabla de Contenidos

1. [Características](#características)
2. [Requisitos](#requisitos)
3. [Instalación y Configuración](#instalación-y-configuración)
4. [Arquitectura](#arquitectura)
5. [Sistema de Autenticación](#sistema-de-autenticación)
6. [Componentes Principales](#componentes-principales)
7. [Hooks Personalizados](#hooks-personalizados)
8. [Integración con Microsoft](#integración-con-microsoft)
9. [API Cliente](#api-cliente)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 Características

- **Autenticación Dual**: Login local + Microsoft OAuth (MSAL)
- **Dashboard Dinámico**: Estadísticas en tiempo real por rol
- **Gestión de Proyectos**: Vista Kanban con drag & drop visual
- **Gestión de Tareas**: Sistema Kanban de 5 columnas
- **Registro de Actividades**: Vinculación con proyectos/tareas
- **Calendario Microsoft**: Conversión de reuniones en actividades
- **Sistema de Roles**: UI adaptada según permisos
- **Componentes Reutilizables**: Badges, Cards, Loaders, EmptyStates
- **Estado Global**: React Query para cache y sincronización
- **UI Moderna**: Shadcn/ui + Tailwind CSS
- **Responsivo**: Diseño adaptable a móviles y tablets

---

## 📋 Requisitos

- **Node.js** 18 o superior
- **pnpm** (gestor de paquetes recomendado)
- Backend corriendo en `http://localhost:8080`

```bash
npm install -g pnpm
```

---

## 🔧 Instalación y Configuración

### 1. Instalar Dependencias

```bash
cd frontend
pnpm install
```

### 2. Variables de Entorno

Crear archivo `.env` en la carpeta `frontend/`:

```env
# Backend API
VITE_API_BASE_URL=http://localhost:8080/api/v1

# Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=tu_client_id
VITE_MICROSOFT_TENANT_ID=tu_tenant_id
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback
```

### 3. Ejecutar en Desarrollo

```bash
pnpm dev
```

**La aplicación estará disponible en: `http://localhost:5173`**

### 4. Build para Producción

```bash
pnpm build
pnpm preview  # Preview del build
```

---

## 🏗️ Arquitectura

### Estructura del Proyecto

```
frontend/
├── public/              # Archivos estáticos
├── src/
│   ├── api/            # Clientes API
│   │   ├── client.js           # Axios configurado
│   │   ├── auth.js             # Endpoints de auth
│   │   ├── users.js            # Endpoints de usuarios
│   │   ├── areas.js            # Endpoints de áreas
│   │   ├── projects.js         # Endpoints de proyectos
│   │   ├── tasks.js            # Endpoints de tareas
│   │   ├── activities.js       # Endpoints de actividades
│   │   ├── stats.js            # Endpoints de estadísticas
│   │   ├── comments.js         # Endpoints de comentarios
│   │   └── integrations.js     # Calendario MS
│   ├── components/      # Componentes React
│   │   ├── common/             # Componentes reutilizables
│   │   │   ├── StatCard.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Loader.jsx
│   │   │   ├── Badges.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   ├── projects/           # Componentes de proyectos
│   │   │   ├── ProjectCard.jsx
│   │   │   ├── ProjectFormDialog.jsx
│   │   │   └── ProjectKanban.jsx
│   │   ├── tasks/              # Componentes de tareas
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskFormDialog.jsx
│   │   │   └── TaskKanban.jsx
│   │   ├── activities/         # Componentes de actividades
│   │   │   ├── ActivityCard.jsx
│   │   │   ├── ActivityFormDialog.jsx
│   │   │   └── ActivityList.jsx
│   │   ├── calendar/           # Componentes de calendario
│   │   │   └── CalendarEvents.jsx
│   │   ├── admin/              # Componentes admin
│   │   │   ├── UserManagement.jsx
│   │   │   └── AreaManagement.jsx
│   │   ├── dashboard/          # Componentes dashboard
│   │   │   ├── StatsOverview.jsx
│   │   │   └── RecentActivities.jsx
│   │   ├── ui/                 # Componentes Shadcn/ui
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── dialog.jsx
│   │   │   └── ... (más componentes)
│   │   └── ProtectedRoute.jsx  # HOC para rutas protegidas
│   ├── config/          # Configuración
│   │   └── authConfig.js       # Config MSAL
│   ├── constants/       # Constantes centralizadas
│   │   └── index.js
│   ├── contexts/        # Contextos React
│   │   └── AuthContext.jsx     # Estado de autenticación
│   ├── hooks/           # Hooks personalizados
│   │   ├── use-toast.jsx
│   │   ├── use-mobile.jsx
│   │   └── useProjects.js
│   ├── lib/             # Utilidades
│   │   └── utils.js            # Helpers, cn()
│   ├── pages/           # Páginas principales
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Projects.jsx
│   │   ├── ProjectDetail.jsx
│   │   ├── Activities.jsx
│   │   ├── Calendar.jsx
│   │   ├── Admin.jsx
│   │   └── Layout.jsx
│   ├── services/        # Servicios
│   │   ├── authService.js
│   │   └── calendarService.js
│   ├── utils/           # Utilidades adicionales
│   │   └── helpers.js
│   ├── App.jsx          # Componente raíz
│   ├── App.css
│   ├── main.jsx         # Punto de entrada
│   └── index.css        # Estilos globales
├── .env                 # Variables de entorno
├── .env.example         # Template de variables
├── components.json      # Config Shadcn
├── jsconfig.json        # Alias de paths
├── package.json
├── pnpm-lock.yaml
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── verify-config.js     # Script de verificación
```

### Flujo de Datos

```
Usuario interactúa con componente
  ↓
Hook personalizado (useProjects, useAuth)
  ↓
React Query (TanStack Query)
  ↓
API Cliente (Axios)
  ↓
Backend (Go/Gin)
  ↓
PostgreSQL
```

---

## 🔐 Sistema de Autenticación

### Contexto de Autenticación

El `AuthContext` proporciona:

- `user`: Usuario actual
- `login(email, password)`: Login local
- `loginWithMicrosoft()`: Login con OAuth
- `logout()`: Cerrar sesión
- `isAuthenticated`: Estado de autenticación

### Login Local

```jsx
import { useAuth } from "@/contexts/AuthContext";

function LoginComponent() {
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Redirige automáticamente a dashboard
    } catch (error) {
      console.error("Error:", error.message);
    }
  };
}
```

### Login con Microsoft

```jsx
import { useAuth } from "@/contexts/AuthContext";

function LoginComponent() {
  const { loginWithMicrosoft } = useAuth();

  const handleMicrosoftLogin = async () => {
    try {
      await loginWithMicrosoft();
      // Redirige automáticamente a dashboard
    } catch (error) {
      console.error("Error:", error.message);
    }
  };
}
```

### Configuración MSAL

**Archivo:** `src/config/authConfig.js`

```javascript
export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${
      import.meta.env.VITE_MICROSOFT_TENANT_ID
    }`,
    redirectUri: import.meta.env.VITE_MICROSOFT_REDIRECT_URI,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read", "email", "profile", "openid", "Calendars.Read"],
};
```

### Rutas Protegidas

```jsx
import ProtectedRoute from "@/components/ProtectedRoute";

<Routes>
  <Route path="/login" element={<Login />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
</Routes>;
```

---

## 🧩 Componentes Principales

### Componentes Comunes Reutilizables

#### StatCard

Tarjeta de estadística con icono, título, valor y tendencia.

```jsx
import { StatCard } from "@/components/common/StatCard";
import { FolderKanban } from "lucide-react";

<StatCard
  title="Total Proyectos"
  value={25}
  icon={<FolderKanban className="h-4 w-4" />}
  trend="up"
  description="+12% desde el mes pasado"
/>;
```

#### EmptyState

Estado vacío genérico para listas/tablas.

```jsx
import { EmptyState } from "@/components/common/EmptyState";
import { ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";

<EmptyState
  icon={<ListTodo className="h-12 w-12" />}
  title="No hay tareas"
  description="Crea tu primera tarea para empezar"
  action={<Button onClick={handleCreate}>Crear Tarea</Button>}
/>;
```

#### Badges

Badges especializados para estados y prioridades.

```jsx
import { StatusBadge, PriorityBadge } from '@/components/common/Badges';

<StatusBadge status="in_progress" />
<PriorityBadge priority="high" />
```

#### Loader

Spinner centralizado con tamaños configurables.

```jsx
import { Loader } from "@/components/common/Loader";

<Loader size="lg" text="Cargando proyectos..." />;
```

### ProjectFormDialog

Formulario para crear/editar proyectos.

**Props:**

- `open`: boolean - Estado del diálogo
- `onOpenChange`: (open: boolean) => void
- `onSubmit`: (data) => void
- `isLoading`: boolean
- `project`: Object | null - Proyecto a editar

```jsx
import { ProjectFormDialog } from "@/components/projects/ProjectFormDialog";

<ProjectFormDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={handleSubmit}
  isLoading={isLoading}
  project={editingProject}
/>;
```

### TaskKanban

Vista Kanban de tareas con 5 columnas.

```jsx
import { TaskKanban } from "@/components/tasks/TaskKanban";

<TaskKanban
  tasks={tasks}
  onStatusChange={handleStatusChange}
  onTaskUpdate={handleUpdate}
  onTaskDelete={handleDelete}
/>;
```

### ActivityFormDialog

Formulario para registrar actividades.

```jsx
import { ActivityFormDialog } from "@/components/activities/ActivityFormDialog";

<ActivityFormDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onSubmit={handleSubmit}
  projects={projects}
  isLoading={isLoading}
/>;
```

---

## 🪝 Hooks Personalizados

### useProjects

Hook completo para gestión de proyectos.

```jsx
import { useProjects } from "@/hooks/useProjects";
import { useAuth } from "@/contexts/AuthContext";

function ProjectsPage() {
  const { user } = useAuth();
  const { projects, isLoading, createProject, updateProject, deleteProject } =
    useProjects(user);

  const handleCreate = async (data) => {
    await createProject.mutateAsync(data);
    // Toast automático de éxito/error
  };
}
```

**Retorna:**

- `projects`: Array de proyectos
- `isLoading`: Estado de carga
- `createProject`: Mutation de creación
- `updateProject`: Mutation de actualización
- `deleteProject`: Mutation de eliminación

### useAuth

Hook de autenticación (del contexto).

```jsx
import { useAuth } from "@/contexts/AuthContext";

function Component() {
  const { user, login, logout, isAuthenticated } = useAuth();
}
```

### use-toast

Hook para mostrar notificaciones.

```jsx
import { useToast } from "@/hooks/use-toast";

function Component() {
  const { toast } = useToast();

  const showSuccess = () => {
    toast({
      title: "Éxito",
      description: "Operación completada",
    });
  };

  const showError = () => {
    toast({
      title: "Error",
      description: "Algo salió mal",
      variant: "destructive",
    });
  };
}
```

---

## 📅 Integración con Microsoft

### Obtener Eventos del Calendario

```jsx
import { calendarService } from "@/services/calendarService";

// Eventos de hoy
const todayEvents = await calendarService.getTodayEvents(accessToken);

// Eventos en rango
const events = await calendarService.getEventsInRange(
  accessToken,
  startDate,
  endDate
);
```

### Componente CalendarEvents

```jsx
import { CalendarEvents } from "@/components/calendar/CalendarEvents";

<CalendarEvents
  accessToken={microsoftToken}
  onCreateActivity={handleCreateFromEvent}
/>;
```

### Flujo de Conversión de Reunión a Actividad

1. Usuario ve sus reuniones del día
2. Hace clic en "Crear Actividad"
3. Se abre diálogo con datos pre-llenados:
   - Nombre de la reunión
   - Duración calculada
   - Notas opcionales
4. Usuario puede vincular a proyecto/tarea
5. Se crea la actividad en el backend

---

## 📡 API Cliente

### Configuración Base

**Archivo:** `src/api/client.js`

```javascript
import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// Interceptor para incluir token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

### Ejemplo de Cliente API

**Archivo:** `src/api/projects.js`

```javascript
import client from "./client";

export const projectsApi = {
  getAll: () => client.get("/projects"),
  getById: (id) => client.get(`/projects/${id}`),
  create: (data) => client.post("/projects", data),
  update: (id, data) => client.put(`/projects/${id}`, data),
  delete: (id) => client.delete(`/projects/${id}`),
  updateStatus: (id, status) =>
    client.patch(`/projects/${id}/status`, { status }),
};
```

### Uso con React Query

```jsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi } from "@/api/projects";

function useProjectsQuery() {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
      toast({ title: "Proyecto creado" });
    },
  });

  return { projects, isLoading, createProject: createMutation };
}
```

---

## 🎨 Constantes Centralizadas

**Archivo:** `src/constants/index.js`

### STATUS_CONFIG

Configuración de estados con colores y labels.

```javascript
export const STATUS_CONFIG = {
  unassigned: {
    label: "Sin asignar",
    color: "gray",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
  },
  in_progress: {
    label: "En progreso",
    color: "blue",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
  },
  // ... más estados
};
```

### PRIORITY_CONFIG

Configuración de prioridades con iconos.

```javascript
export const PRIORITY_CONFIG = {
  urgent: {
    label: "Urgente",
    color: "red",
    icon: "AlertTriangle",
  },
  high: {
    label: "Alta",
    color: "orange",
    icon: "ArrowUp",
  },
  // ... más prioridades
};
```

### TASK_COLUMNS

Definición de columnas del Kanban.

```javascript
export const TASK_COLUMNS = [
  { id: "backlog", title: "Backlog", color: "gray" },
  { id: "assigned", title: "Asignadas", color: "yellow" },
  { id: "in_progress", title: "En Progreso", color: "blue" },
  { id: "paused", title: "Pausadas", color: "orange" },
  { id: "completed", title: "Completadas", color: "green" },
];
```

---

## 🚀 Deployment

### Build para Producción

```bash
pnpm build
```

**Salida:** Carpeta `dist/` con archivos estáticos

### Variables de Entorno de Producción

```env
VITE_API_BASE_URL=https://api.timeflow.tuempresa.com/api/v1
VITE_MICROSOFT_CLIENT_ID=tu_client_id
VITE_MICROSOFT_TENANT_ID=tu_tenant_id
VITE_MICROSOFT_REDIRECT_URI=https://timeflow.tuempresa.com/auth/callback
```

### Opción 1: Azure Static Web Apps

```bash
# 1. Build
pnpm build

# 2. Deploy con Azure CLI
az staticwebapp create \
  --name timeflow-frontend \
  --resource-group timeflow-rg \
  --source ./dist \
  --location "East US"
```

### Opción 2: Netlify

```bash
# 1. Instalar CLI
npm install -g netlify-cli

# 2. Build
pnpm build

# 3. Deploy
netlify deploy --prod --dir=dist
```

### Opción 3: Vercel

```bash
# 1. Instalar CLI
npm install -g vercel

# 2. Deploy (build automático)
vercel --prod
```

### Opción 4: Servidor Estático (Nginx)

**nginx.conf:**

```nginx
server {
    listen 80;
    server_name timeflow.tuempresa.com;
    root /var/www/timeflow/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Configurar CORS si es necesario
    add_header Access-Control-Allow-Origin "https://api.timeflow.tuempresa.com";
}
```

---

## 🔧 Troubleshooting

### Error: "Network Error" al llamar API

**Causa:** Backend no está corriendo o URL incorrecta

**Solución:**

```bash
# Verificar que el backend esté corriendo
curl http://localhost:8080/api/v1/auth/me

# Verificar variable de entorno
echo $VITE_API_BASE_URL
```

### Error: "Cannot read properties of undefined"

**Causa:** Datos no cargados o estructura incorrecta

**Solución:** Agregar validaciones:

```jsx
{
  projects?.map((project) => (
    <ProjectCard key={project.id} project={project} />
  ));
}

// O usar valor por defecto
const projects = data?.data || [];
```

### Error: MSAL "Redirect URI mismatch"

**Causa:** URI de redirección no coincide con Azure AD

**Solución:**

1. Verificar `.env`:

```env
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback
```

2. Verificar en Azure Portal que el URI esté registrado

### Error: "Token expired" (401)

**Causa:** JWT expiró

**Solución:** El interceptor de Axios detecta 401 y redirige a login:

```javascript
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### Error: Componentes de Shadcn no se ven bien

**Causa:** Tailwind no configurado correctamente

**Solución:**

```bash
# Verificar que Tailwind esté instalado
pnpm list tailwindcss

# Verificar tailwind.config.js
cat tailwind.config.js

# Reconstruir
pnpm dev
```

### Error: "Cannot find module '@/...'"

**Causa:** Alias de paths no configurado

**Solución:** Verificar `jsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

Y `vite.config.js`:

```javascript
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

---

## 📚 Referencias

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Router](https://reactrouter.com/)
- [Shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [MSAL.js](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Axios](https://axios-http.com/)

---

## 👤 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo.
