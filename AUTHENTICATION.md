# Sistema de Autenticación y Control de Acceso

## Descripción General

El sistema implementa autenticación basada en JWT (JSON Web Tokens) con tres niveles de roles y filtrado automático de datos según el rol del usuario.

## Roles de Usuario

### 1. **SuperAdmin** (`superadmin`)

- **Acceso**: Total y sin restricciones
- **Datos visibles**: Todos los usuarios, áreas, proyectos y actividades del sistema
- **Permisos especiales**:
  - Crear, editar y eliminar áreas
  - Gestionar usuarios de todas las áreas
  - Ver estadísticas globales del sistema

### 2. **Admin** (`admin`)

- **Acceso**: Limitado a su área asignada
- **Datos visibles**:
  - Usuarios de su área únicamente
  - Proyectos de su área
  - Actividades de usuarios de su área
- **Permisos**:
  - Gestionar usuarios dentro de su área
  - Ver reportes y estadísticas del área
  - Crear y modificar proyectos del área

### 3. **User** (`user`)

- **Acceso**: Solo a sus propios datos
- **Datos visibles**:
  - Sus propias actividades
  - Sus propios proyectos
  - Su información personal
- **Permisos**:
  - Crear y gestionar sus actividades
  - Crear y gestionar sus proyectos personales
  - Modificar su configuración personal

## Flujo de Autenticación

### Login

```javascript
// El usuario ingresa credenciales
POST /api/auth/login
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña"
}

// Respuesta exitosa
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "usuario@ejemplo.com",
    "full_name": "Usuario Ejemplo",
    "role": "admin",
    "area_id": 2
  }
}
```

### Protección de Rutas

Todas las rutas excepto `/login` requieren autenticación:

```jsx
// Ruta protegida básica
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Ruta con restricción de rol
<ProtectedRoute allowedRoles={['superadmin', 'admin']}>
  <Admin />
</ProtectedRoute>
```

### Token Storage

- El token JWT se almacena en `localStorage` después del login exitoso
- Se incluye automáticamente en todas las peticiones HTTP mediante interceptor de Axios
- Se valida en cada petición al backend

## Filtrado Automático de Datos

### Dashboard

```javascript
// Usuario normal
const params = {
  date: today,
  user_email: user.email, // Solo sus datos
};

// Admin
const params = {
  date: today,
  area_id: user.area_id, // Datos de su área
};

// SuperAdmin
const params = {
  date: today, // Todos los datos
};
```

### Actividades

- **User**: `user_email = email_actual`
- **Admin**: `area_id = area_del_admin`
- **SuperAdmin**: Sin filtro (todas las actividades)

### Proyectos

- **User**: `creator_id = id_actual`
- **Admin**: `area_id = area_del_admin`
- **SuperAdmin**: Sin filtro (todos los proyectos)

### Panel Administrativo

- **Admin**: Solo accede a usuarios y actividades de su área
- **SuperAdmin**: Accede a todos los usuarios y actividades

## Implementación Técnica

### Contexto de Autenticación

```jsx
// contexts/AuthContext.jsx
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Verifica token al cargar
  useEffect(() => {
    checkAuth();
  }, []);

  // Funciones: login, logout, checkAuth
  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Hook de Autenticación

```jsx
// Usar en cualquier componente
import { useAuth } from "@/contexts/AuthContext";

function MiComponente() {
  const { user, logout } = useAuth();

  // user contiene: id, email, full_name, role, area_id, area
  return (
    <div>
      <p>Bienvenido {user.full_name}</p>
      <p>Rol: {user.role}</p>
      {user.role === "admin" && <p>Área: {user.area?.name}</p>}
    </div>
  );
}
```

### Interceptor HTTP

```javascript
// api/client.js
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

## Credenciales por Defecto

El sistema crea automáticamente un SuperAdmin al iniciar:

```
Email: admin@timeflow.com
Password: admin123
Role: superadmin
```

**IMPORTANTE**: Cambiar estas credenciales en producción.

## Seguridad

### Frontend

- ✅ Rutas protegidas con `ProtectedRoute`
- ✅ Validación de roles antes de mostrar contenido
- ✅ Token almacenado en localStorage
- ✅ Redirección automática a login si no hay token
- ✅ Logout limpia token y redirige

### Backend

- ✅ Middleware de autenticación JWT
- ✅ Middleware de autorización por rol
- ✅ Passwords hasheados con bcrypt
- ✅ Validación de área_id en operaciones
- ✅ Soft delete para mantener integridad

## Ejemplo de Uso Completo

```jsx
import { useAuth } from "@/contexts/AuthContext";
import { activitiesAPI } from "@/api";

function Activities() {
  const { user } = useAuth();

  // Query con filtrado automático por rol
  const { data: activities } = useQuery({
    queryKey: ["activities", user?.id],
    queryFn: async () => {
      const params = { month: currentMonth };

      // Aplicar filtro según rol
      if (user?.role === "user") {
        params.user_email = user.email;
      } else if (user?.role === "admin" && user?.area_id) {
        params.area_id = user.area_id;
      }
      // SuperAdmin: sin filtro adicional

      return await activitiesAPI.getAll(params);
    },
    enabled: !!user,
  });

  return (
    <div>
      <h1>
        {user?.role === "superadmin" && "Todas las Actividades"}
        {user?.role === "admin" && `Actividades del Área ${user.area?.name}`}
        {user?.role === "user" && "Mis Actividades"}
      </h1>
      {/* Render activities */}
    </div>
  );
}
```

## Verificación del Sistema

### 1. Login

- [ ] Muestra pantalla de login al iniciar sin token
- [ ] Acepta credenciales correctas y redirige a Dashboard
- [ ] Rechaza credenciales incorrectas con mensaje de error
- [ ] Guarda token en localStorage

### 2. Protección de Rutas

- [ ] Redirige a /login si no hay token
- [ ] Permite acceso a rutas con token válido
- [ ] Ruta /Admin solo accesible para admin y superadmin
- [ ] User no puede acceder a /Admin

### 3. Filtrado de Datos

- [ ] User ve solo sus propios datos
- [ ] Admin ve solo datos de su área
- [ ] SuperAdmin ve todos los datos
- [ ] Panel Admin muestra mensaje según rol

### 4. Logout

- [ ] Botón de logout visible en sidebar
- [ ] Limpia token de localStorage
- [ ] Redirige a /login
- [ ] No permite acceso sin nuevo login
