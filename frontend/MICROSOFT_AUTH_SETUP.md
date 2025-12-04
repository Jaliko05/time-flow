# 🔐 Configuración de Autenticación Microsoft

## 📋 Configuración Rápida

### 1. Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto frontend con las siguientes variables:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_MICROSOFT_CLIENT_ID=2d4b4454-ccc4-4931-bc2e-7dcbac06b926
VITE_MICROSOFT_TENANT_ID=bf0b4836-49ef-44dc-986e-cc5e5fc3c7e0
```

### 2. Instalación de Dependencias

Las dependencias ya fueron instaladas:

- `@azure/msal-browser` - Cliente MSAL para navegador
- `@azure/msal-react` - Integración MSAL con React

### 3. Características Implementadas

#### ✅ Autenticación Dual

- **Login Local**: Email y contraseña tradicional
- **Login Microsoft**: OAuth 2.0 con Microsoft Azure AD

#### ✅ Integración con Microsoft Calendar

- Obtener eventos del calendario de Microsoft
- Convertir reuniones en actividades
- Ajustar duración de actividades
- Agregar notas personalizadas

#### ✅ Gestión de Sesión

- Almacenamiento de tokens JWT
- Cierre de sesión dual (local + Microsoft)
- Validación automática de sesión
- Manejo de tokens expirados

## 🚀 Uso

### Login con Microsoft

1. Haz clic en "Continuar con Microsoft" en la página de login
2. Serás redirigido a Microsoft para autenticarte
3. Acepta los permisos solicitados:
   - `User.Read` - Leer perfil básico
   - `email` - Acceso a email
   - `profile` - Acceso a perfil
   - `openid` - Autenticación OpenID

### Acceso al Calendario

1. Inicia sesión con tu cuenta de Microsoft
2. Ve a la sección "Calendario" en el menú lateral
3. Se mostrarán tus eventos del día
4. Haz clic en "Crear Actividad" para convertir una reunión en actividad

## 📂 Archivos Creados

```
frontend/
├── src/
│   ├── config/
│   │   └── authConfig.js          # Configuración MSAL
│   ├── services/
│   │   ├── authService.js         # Servicio de autenticación
│   │   └── calendarService.js     # Servicio de calendario
│   ├── components/
│   │   └── calendar/
│   │       └── CalendarEvents.jsx # Componente de calendario
│   ├── pages/
│   │   ├── Login.jsx             # Actualizado con botón Microsoft
│   │   └── Calendar.jsx          # Página de calendario
│   └── contexts/
│       └── AuthContext.jsx       # Actualizado con métodos Microsoft
└── .env.example                   # Template de variables de entorno
```

## 🔧 Configuración del Backend

Asegúrate de que tu backend tenga los endpoints necesarios:

### Autenticación

- `POST /api/v1/auth/login` - Login local
- `POST /api/v1/auth/microsoft` - Login con Microsoft
- `GET /api/v1/auth/me` - Obtener usuario actual

### Calendario

- `POST /api/v1/calendar/today` - Eventos de hoy
- `POST /api/v1/calendar/events` - Eventos en rango de fechas

## 🛠️ Solución de Problemas

### Error: "No hay sesión de Microsoft activa"

- Asegúrate de haber iniciado sesión con Microsoft
- Verifica que los tokens no hayan expirado
- Intenta cerrar sesión y volver a iniciar

### Error: "Permisos de calendario no otorgados"

- Ve a la configuración de tu cuenta Microsoft
- Revoca permisos y vuelve a autenticarte
- Acepta el permiso `Calendars.Read`

### Error de configuración MSAL

- Verifica que las variables de entorno estén correctas
- Asegúrate de que el `redirectUri` coincida con tu URL local
- Revisa la consola del navegador para más detalles

## 📝 Notas Importantes

1. **Desarrollo Local**: La URL de redirección debe ser `http://localhost:5173/auth/callback` (o el puerto que uses en Vite)

2. **Producción**: Actualiza la `redirectUri` en `authConfig.js` con tu dominio de producción

3. **Permisos**: Los permisos de calendario (`Calendars.Read`) solo se solicitan cuando accedes a la sección de calendario

4. **Sesión**: El token de Microsoft se almacena en `sessionStorage` y se limpia automáticamente al cerrar el navegador

## 🎯 Próximos Pasos

Para completar la configuración:

1. Copia `.env.example` a `.env`
2. Verifica que el backend esté corriendo en `http://localhost:8080`
3. Inicia el frontend con `pnpm dev`
4. Prueba el login con Microsoft
5. Accede al calendario y verifica la integración

## 📚 Recursos

- [MSAL.js Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview)
- [Azure AD OAuth 2.0](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
