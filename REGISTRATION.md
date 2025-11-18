# Registro de Usuarios - TimeTracker

## 🎯 Funcionalidad Implementada

Se ha agregado un sistema de **registro público de usuarios** que permite crear cuentas sin necesidad de autenticación previa.

---

## 📋 Características

### **Registro Público**

- ✅ Ruta pública `/register` accesible sin login
- ✅ Formulario con validación de campos
- ✅ Los usuarios creados tienen rol `user` por defecto
- ✅ Selección opcional de área
- ✅ Validación de correo único
- ✅ Contraseña mínima de 6 caracteres
- ✅ Redirección automática a login después del registro

### **API Endpoints Públicos**

#### 1. **POST /api/v1/auth/register**

Crea un nuevo usuario sin autenticación.

**Request Body:**

```json
{
  "email": "usuario@ejemplo.com",
  "password": "contraseña123",
  "full_name": "Nombre Completo",
  "area_id": 1 // Opcional
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 5,
    "email": "usuario@ejemplo.com",
    "full_name": "Nombre Completo",
    "role": "user",
    "area_id": 1,
    "is_active": true
  }
}
```

**Errores:**

- `400` - Email ya existe
- `400` - Validación de campos fallida
- `500` - Error del servidor

#### 2. **GET /api/v1/areas**

Lista todas las áreas disponibles (público).

**Response (200):**

```json
{
  "success": true,
  "message": "Areas retrieved successfully",
  "data": [
    {
      "id": 1,
      "name": "Desarrollo",
      "description": "Área de desarrollo de software"
    }
  ]
}
```

---

## 🚀 Uso en Frontend

### **Acceso a Registro**

1. Abre `http://localhost:5173/login`
2. Haz clic en "¿No tienes cuenta? Regístrate aquí"
3. Completa el formulario de registro
4. Serás redirigido al login automáticamente

### **Componentes Creados**

#### `Register.jsx`

- Formulario de registro completo
- Validación de campos en frontend
- Integración con API de registro
- Mensajes de error y éxito
- Enlace para volver al login

#### Ruta Agregada

```jsx
<Route path="/register" element={<Register />} />
```

---

## 🔐 Seguridad

### **Validaciones Backend**

1. **Email único**: Verifica que el correo no exista
2. **Contraseña segura**: Mínimo 6 caracteres, hasheada con bcrypt
3. **Rol forzado**: Los registros públicos siempre crean usuarios con rol `user`
4. **Área opcional**: Puede registrarse sin área asignada

### **Validaciones Frontend**

1. Email válido (formato)
2. Contraseña mínima 6 caracteres
3. Nombre completo obligatorio
4. Área opcional con selector

---

## 📝 Flujo de Registro

```
1. Usuario visita /register
   ↓
2. Completa formulario (email, contraseña, nombre, área)
   ↓
3. Frontend envía POST /api/v1/auth/register
   ↓
4. Backend valida y crea usuario con rol "user"
   ↓
5. Frontend muestra éxito y redirige a /login
   ↓
6. Usuario inicia sesión con sus credenciales
```

---

## 🧪 Pruebas

### **Con cURL**

```bash
# Registrar nuevo usuario
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nuevo@usuario.com",
    "password": "password123",
    "full_name": "Nuevo Usuario",
    "area_id": 1
  }'

# Listar áreas (público)
curl http://localhost:8080/api/v1/areas
```

### **Con Postman**

1. **POST** `http://localhost:8080/api/v1/auth/register`

   - Body: raw JSON con datos del usuario
   - Sin headers de autenticación

2. **GET** `http://localhost:8080/api/v1/areas`
   - Sin autenticación requerida

---

## 🔄 Diferencias con Creación Autenticada

| Aspecto       | Registro Público | Creación por Admin     |
| ------------- | ---------------- | ---------------------- |
| Autenticación | No requerida     | Token JWT requerido    |
| Rol asignado  | Siempre `user`   | Configurable por Admin |
| Área          | Opcional         | Validada según rol     |
| Endpoint      | `/auth/register` | `/users`               |
| Permisos      | Cualquiera       | Admin/SuperAdmin       |

---

## 📦 Archivos Modificados

### **Backend**

- ✅ `routes/routes.go` - Ruta pública `/auth/register` y `/areas`
- ✅ `handlers/users.go` - `CreateUser` acepta contexto sin auth

### **Frontend**

- ✅ `pages/Register.jsx` - Componente de registro
- ✅ `pages/Login.jsx` - Enlace a registro
- ✅ `pages/index.jsx` - Ruta `/register`

---

## 🎨 UI del Formulario de Registro

- **Diseño consistente** con página de login
- **Validación en tiempo real** de campos
- **Mensajes de error claros**
- **Feedback visual** de éxito/error
- **Responsive** para móviles y desktop
- **Modo oscuro** soportado

---

## 💡 Notas Importantes

1. **Primer Usuario**: Ya no es necesario usar Swagger o crear usuario por SQL, ahora cualquiera puede registrarse
2. **Rol por Defecto**: Todos los registros públicos son `user`, para crear admins usar el panel administrativo
3. **SuperAdmin Inicial**: La cuenta `admin@timeflow.com` sigue siendo necesaria para administración inicial
4. **Áreas**: Se pueden ver públicamente pero solo SuperAdmin puede crear/editar/eliminar

---

## 🔧 Configuración Adicional

Si deseas **deshabilitar el registro público**:

1. Elimina la ruta en `routes.go`:

```go
// Comentar o eliminar esta línea
// auth.POST("/register", handlers.CreateUser)
```

2. Oculta el enlace en `Login.jsx`:

```jsx
// Comentar el enlace de registro
{
  /* <Link to="/register">¿No tienes cuenta? Regístrate aquí</Link> */
}
```

---

## ✅ Verificación

Para verificar que el registro funciona correctamente:

1. **Inicia el backend**:

```bash
cd backend
go run main.go
```

2. **Inicia el frontend**:

```bash
cd frontend
npm run dev
```

3. **Abre** `http://localhost:5173/register`

4. **Registra un usuario** de prueba

5. **Inicia sesión** con las credenciales creadas

6. **Verifica** que apareces en el panel administrativo (como SuperAdmin)

---

## 📚 Recursos Relacionados

- [AUTHENTICATION.md](./AUTHENTICATION.md) - Sistema de autenticación completo
- [INSTALLATION.md](./INSTALLATION.md) - Guía de instalación
- [README.md](./README.md) - Documentación general del proyecto
