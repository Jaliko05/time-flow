# Correcciones Aplicadas - Admin de Área y Rendimiento

## ✅ Cambios Realizados

### 1. **Performance: Índice en users.area_id**

**Problema:** Query de 30+ segundos al filtrar usuarios por área  
**Causa:** Sin índice en columna `area_id` → escaneo completo de tabla

**Soluciones aplicadas:**

- ✅ Agregado tag `gorm:"index"` en `backend/models/user.go`
- ✅ Creado script SQL: `backend/apply-index-migration.sql`

**Acción requerida:**

```sql
-- Ejecuta este comando en tu cliente PostgreSQL (pgAdmin, DBeaver, etc.)
CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id);
```

---

### 2. **Frontend: Props incorrectas en ProjectFormDialog**

**Problema:** `onSave is not a function` - Componente recibía props diferentes a las esperadas

**Cambios aplicados:**

- ✅ Actualizado para recibir: `onOpenChange`, `onSubmit`, `isLoading`
- ✅ Eliminada dependencia de props externas `userRole` y `users`
- ✅ Agregado `useAuth()` para obtener usuario actual
- ✅ Agregado `useQuery` para cargar usuarios automáticamente
- ✅ Agregado `DialogDescription` para eliminar warning de accesibilidad

**Archivos modificados:**

- `frontend/src/components/projects/ProjectFormDialog.jsx`

---

## 🔧 Pasos para Completar la Corrección

### Paso 1: Aplicar migración de base de datos

Abre tu cliente PostgreSQL favorito y ejecuta:

```sql
CREATE INDEX IF NOT EXISTS idx_users_area_id ON users(area_id);
```

O ejecuta el archivo completo:

```
backend/apply-index-migration.sql
```

### Paso 2: Reiniciar el backend

```powershell
cd backend
go run main.go
```

### Paso 3: Verificar el frontend

El frontend ya debería funcionar correctamente. Verifica:

- ✅ Admin de área puede abrir diálogo de nuevo proyecto
- ✅ Admin puede elegir tipo "Área" o "Personal"
- ✅ Admin puede asignar proyectos de área a usuarios
- ✅ No aparece error "onSave is not a function"

---

## 📊 Resultados Esperados

### Performance

- **Antes:** `SELECT * FROM users WHERE area_id = 1` → 30+ segundos
- **Después:** `SELECT * FROM users WHERE area_id = 1` → < 100ms

### Funcionalidad

- ✅ Admin de área puede crear proyectos personales
- ✅ Admin de área puede crear proyectos de área
- ✅ Admin de área puede asignar proyectos a usuarios de su área
- ✅ Usuarios de área aparecen en selector de asignación

---

## 🐛 Si persisten errores

### Error: "Query sigue siendo lenta"

Verifica que el índice se creó correctamente:

```sql
SELECT * FROM pg_indexes WHERE tablename = 'users' AND indexname = 'idx_users_area_id';
```

### Error: "No aparecen usuarios en el selector"

Revisa que la API `/api/v1/users` devuelva usuarios de tu área:

```javascript
// En console del navegador
fetch("/api/v1/users", {
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
})
  .then((r) => r.json())
  .then(console.log);
```

---

## 📝 Cambios Técnicos Detallados

### backend/models/user.go

```go
// Antes:
AreaID *uint `json:"area_id"`

// Después:
AreaID *uint `gorm:"index" json:"area_id"` // Index added for performance
```

### frontend/src/components/projects/ProjectFormDialog.jsx

```javascript
// Antes:
export default function ProjectFormDialog({
  onClose,
  onSave,
  isSubmitting,
  userRole,
  users = [],
})

// Después:
export default function ProjectFormDialog({
  onOpenChange,
  onSubmit,
  isLoading = false,
}) {
  const { user } = useAuth();
  const userRole = user?.role;

  const { data: users = [] } = useQuery({
    queryKey: ['users', user?.area_id],
    queryFn: () => usersAPI.getAll(),
    enabled: open && (userRole === 'admin' || userRole === 'superadmin'),
  });
```

---

## ✨ Mejoras Adicionales Aplicadas

1. **Accesibilidad:** Agregado `DialogDescription` para cumplir con ARIA
2. **Type Safety:** Props con valores por defecto para evitar undefined
3. **Performance:** Query de usuarios solo se ejecuta cuando se abre el diálogo
4. **UX:** Admin puede ver usuarios de su área automáticamente

---

**Fecha:** 2025-12-10  
**Estado:** ✅ Listo para probar
