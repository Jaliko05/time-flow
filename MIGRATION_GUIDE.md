# 🔄 Guía de Migración de Base44 a Nueva API

Este documento te ayudará a migrar el frontend de Base44 a la nueva API de Go.

## 📋 Cambios Principales

### 1. Importaciones

**Antes (Base44):**

```javascript
import { base44 } from "@/api/base44Client";
import { User, Project, Activity } from "@/api/entities";
```

**Después (Nueva API):**

```javascript
import { authAPI, usersAPI, projectsAPI, activitiesAPI } from "@/api";
```

## 🔐 Autenticación

### Login

**Antes:**

```javascript
// Base44 maneja el login internamente
const user = await base44.auth.login(email, password);
```

**Después:**

```javascript
import { authAPI } from "@/api";

const result = await authAPI.login(email, password);
// result = { token: "...", user: {...} }

// Guardar token (el cliente API lo hace automáticamente)
localStorage.setItem("token", result.token);
localStorage.setItem("user", JSON.stringify(result.user));
```

### Obtener Usuario Actual

**Antes:**

```javascript
const currentUser = await base44.auth.me();
```

**Después:**

```javascript
const currentUser = await authAPI.me();
```

### Logout

**Antes:**

```javascript
await base44.auth.logout();
```

**Después:**

```javascript
authAPI.logout(); // Limpia localStorage
```

## 👥 Usuarios

### Listar Usuarios

**Antes:**

```javascript
const users = await base44.entities.User.list();
```

**Después:**

```javascript
const users = await usersAPI.getAll();

// Con filtros
const users = await usersAPI.getAll({ area_id: 1 });
```

### Crear Usuario

**Antes:**

```javascript
const user = await base44.entities.User.create({
  email: "user@example.com",
  password: "password123",
  full_name: "User Name",
});
```

**Después:**

```javascript
const user = await usersAPI.create({
  email: "user@example.com",
  password: "password123",
  full_name: "User Name",
  role: "user",
  area_id: 1,
});
```

### Actualizar Usuario

**Antes:**

```javascript
await base44.entities.User.update(userId, {
  full_name: "New Name",
});
```

**Después:**

```javascript
await usersAPI.update(userId, {
  full_name: "New Name",
});
```

## 📁 Proyectos

### Listar Proyectos

**Antes:**

```javascript
const projects = await base44.entities.Project.filter(
  {
    created_by: user.email,
  },
  "-created_date"
);
```

**Después:**

```javascript
const projects = await projectsAPI.getAll({
  created_by: user.id, // Nota: usa ID, no email
});
// Los proyectos ya vienen ordenados por created_at DESC
```

### Crear Proyecto

**Antes:**

```javascript
const project = await base44.entities.Project.create({
  name: "Mi Proyecto",
  description: "Descripción",
  created_by: user.email,
});
```

**Después:**

```javascript
const project = await projectsAPI.create({
  name: "Mi Proyecto",
  description: "Descripción",
  // created_by se toma del token JWT automáticamente
});
```

### Actualizar Proyecto

**Antes:**

```javascript
await base44.entities.Project.update(projectId, {
  name: "Nuevo Nombre",
  is_active: false,
});
```

**Después:**

```javascript
await projectsAPI.update(projectId, {
  name: "Nuevo Nombre",
  is_active: false,
});
```

### Eliminar Proyecto

**Antes:**

```javascript
await base44.entities.Project.update(projectId, {
  is_active: false,
});
```

**Después:**

```javascript
await projectsAPI.delete(projectId);
// Hace soft delete automáticamente
```

## 📊 Actividades

### Listar Actividades

**Antes:**

```javascript
const activities = await base44.entities.Activity.filter(
  {
    user_email: user.email,
    month: "2024-11",
  },
  "-date"
);
```

**Después:**

```javascript
const activities = await activitiesAPI.getAll({
  user_email: user.email,
  month: "2024-11",
});
// Ya vienen ordenadas por date DESC
```

### Crear Actividad

**Antes:**

```javascript
const activity = await base44.entities.Activity.create({
  user_email: user.email,
  user_name: user.full_name,
  project_name: "Proyecto X",
  activity_name: "Tarea Y",
  activity_type: "plan_de_trabajo",
  execution_time: 2.5,
  date: "2024-11-14",
  month: "2024-11",
  team: user.team,
});
```

**Después:**

```javascript
const activity = await activitiesAPI.create({
  project_id: 1, // Opcional
  project_name: "Proyecto X",
  activity_name: "Tarea Y",
  activity_type: "plan_de_trabajo",
  execution_time: 2.5,
  date: "2024-11-14",
  observations: "Notas adicionales",
  // user_id, user_email, user_name, area_id se toman del token JWT
  // month se calcula automáticamente desde date
});
```

### Actualizar Actividad

**Antes:**

```javascript
await base44.entities.Activity.update(activityId, {
  execution_time: 3.0,
  observations: "Actualizado",
});
```

**Después:**

```javascript
await activitiesAPI.update(activityId, {
  execution_time: 3.0,
  observations: "Actualizado",
});
```

### Eliminar Actividad

**Antes:**

```javascript
await base44.entities.Activity.delete(activityId);
```

**Después:**

```javascript
await activitiesAPI.delete(activityId);
```

### Obtener Estadísticas

**Antes:**

```javascript
// No había endpoint específico, se calculaba en frontend
```

**Después:**

```javascript
const stats = await activitiesAPI.getStats({
  month: "2024-11",
  user_id: userId, // Opcional
});

// Retorna:
// {
//   total_hours: 160.5,
//   total_activities: 45,
//   unique_users: 12,
//   daily_average: 8.02,
//   by_type: { plan_de_trabajo: 80, teams: 40, ... },
//   by_area: { "Desarrollo": 100, "Marketing": 60.5 }
// }
```

## 🔄 React Query

Si usas React Query (ya está instalado), los hooks quedan así:

### useQuery

**Antes:**

```javascript
const { data: activities } = useQuery({
  queryKey: ["activities", user?.email, filters],
  queryFn: () =>
    base44.entities.Activity.filter({
      user_email: user?.email,
      month: filters.month,
    }),
  enabled: !!user,
});
```

**Después:**

```javascript
import { activitiesAPI } from "@/api";

const { data: activities } = useQuery({
  queryKey: ["activities", user?.email, filters],
  queryFn: () =>
    activitiesAPI.getAll({
      user_email: user?.email,
      month: filters.month,
    }),
  enabled: !!user,
});
```

### useMutation

**Antes:**

```javascript
const createMutation = useMutation({
  mutationFn: (data) => base44.entities.Activity.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(["activities"]);
  },
});
```

**Después:**

```javascript
import { activitiesAPI } from "@/api";

const createMutation = useMutation({
  mutationFn: (data) => activitiesAPI.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries(["activities"]);
  },
});
```

## 📝 Diferencias Importantes

### 1. Nombres de Campos

| Base44               | Nueva API                         |
| -------------------- | --------------------------------- |
| `created_by` (email) | `created_by` (user ID)            |
| `team`               | `area_id`                         |
| Auto-generado        | `month` calculado automáticamente |

### 2. Respuestas de la API

**Base44:**

```javascript
// Retorna el objeto directamente
const user = await base44.auth.me();
```

**Nueva API:**

```javascript
// Retorna wrapper con metadata
const response = await axios.get("/auth/me");
// response.data = { success: true, data: {...}, message: "..." }

// Pero los módulos API ya extraen el .data.data
const user = await authAPI.me(); // Ya es el objeto directo
```

### 3. Autenticación

**Base44:**

- Maneja autenticación internamente
- No necesitas pasar tokens manualmente

**Nueva API:**

- Token JWT en localStorage
- Interceptor de Axios lo agrega automáticamente
- Si el token expira (401), redirige a login

### 4. IDs

**Base44:**

- Usa emails como identificadores en algunos casos

**Nueva API:**

- Siempre usa IDs numéricos
- El email solo para autenticación

### 5. Roles

**Base44:**

```javascript
if (user.role === 'admin') { ... }
```

**Nueva API:**

```javascript
// Roles: "superadmin", "admin", "user"
if (user.role === 'admin' || user.role === 'superadmin') { ... }
```

## 🛠️ Actualizar Componentes - Checklist

### Dashboard.jsx

- [ ] Cambiar `base44.auth.me()` → `authAPI.me()`
- [ ] Cambiar `base44.entities.Activity.filter()` → `activitiesAPI.getAll()`
- [ ] Cambiar `base44.entities.Activity.create()` → `activitiesAPI.create()`
- [ ] Cambiar `base44.entities.Activity.update()` → `activitiesAPI.update()`
- [ ] Cambiar `base44.entities.Activity.delete()` → `activitiesAPI.delete()`
- [ ] Adaptar campos (team → area_id, etc.)

### Activities.jsx

- [ ] Cambiar imports
- [ ] Actualizar filtros de búsqueda
- [ ] Adaptar función de exportar (los datos vienen igual)
- [ ] Actualizar mutations

### Projects.jsx

- [ ] Cambiar `base44.entities.Project` → `projectsAPI`
- [ ] Remover `created_by` en create (se toma del token)
- [ ] Usar `delete()` en lugar de `update({is_active: false})`

### Admin.jsx

- [ ] Cambiar imports
- [ ] Adaptar filtros por área
- [ ] Usar `usersAPI.getAll()` para usuarios
- [ ] Usar `activitiesAPI.getStats()` para estadísticas

### Crear Login.jsx

```javascript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await authAPI.login(email, password);
      // Token ya guardado por authAPI
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed');
    }
  };

  return (
    // Tu UI de login aquí
  );
}
```

### Actualizar Layout.jsx

```javascript
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  // Resto del componente...
}
```

## 🔍 Testing

Antes de actualizar el frontend completo, prueba cada endpoint con Swagger:

1. Abre http://localhost:8080/swagger/index.html
2. Login con admin@timeflow.com / admin123
3. Copia el token
4. Click "Authorize" y pega: `Bearer <token>`
5. Prueba cada endpoint que vayas a usar

## 💾 Ejemplo Completo de Migración

**Dashboard.jsx - Antes:**

```javascript
const loadUser = async () => {
  const currentUser = await base44.auth.me();
  setUser(currentUser);
};

const { data: activities } = useQuery({
  queryKey: ["activities", user?.email, today],
  queryFn: () =>
    base44.entities.Activity.filter({
      user_email: user?.email,
      date: today,
    }),
  enabled: !!user,
});
```

**Dashboard.jsx - Después:**

```javascript
import { authAPI, activitiesAPI } from "@/api";

const loadUser = async () => {
  try {
    const currentUser = await authAPI.me();
    setUser(currentUser);
  } catch (error) {
    console.error("Error loading user:", error);
  }
};

const { data: activities } = useQuery({
  queryKey: ["activities", user?.email, today],
  queryFn: () =>
    activitiesAPI.getAll({
      user_email: user?.email,
      date: today,
    }),
  enabled: !!user,
});
```

## 🚨 Errores Comunes

### 1. Error 401 - Unauthorized

- Verifica que el token esté en localStorage
- Verifica que el token no haya expirado (24 horas)
- Haz login nuevamente

### 2. Error 403 - Forbidden

- El usuario no tiene permisos para esa operación
- Verifica el rol del usuario
- Verifica que el área sea correcta

### 3. Error 404 - Not Found

- El recurso no existe
- Verifica el ID que estás enviando
- El recurso puede haber sido eliminado (soft delete)

### 4. Error de CORS

- Verifica que el backend esté corriendo
- Verifica CORS_ORIGINS en .env del backend
- Verifica VITE_API_URL en .env del frontend

## ✅ Ventajas de la Nueva API

1. **Más control**: Sabes exactamente qué sucede con cada request
2. **Mejor tipado**: Puedes agregar TypeScript fácilmente
3. **Más rápida**: Sin capa adicional de abstracción
4. **Más segura**: Control total sobre autenticación y autorización
5. **Más escalable**: Puedes agregar features sin depender de terceros
6. **Mejor debugging**: Ves exactamente las requests en Network tab

---

**¡Con esta guía deberías poder migrar todo el frontend exitosamente!**

Empieza con un componente simple (Login), luego Dashboard, y sigue con el resto.
