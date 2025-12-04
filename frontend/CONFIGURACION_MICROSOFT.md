# 🔧 Configuración de Autenticación Microsoft

Esta guía te ayudará a configurar la autenticación de Microsoft en TimeFlow.

---

## 📋 Requisitos Previos

- Cuenta de Microsoft (personal o de organización)
- Cliente ID y Tenant ID de Azure AD (ya configurados en `.env`)

---

## ⚙️ Variables de Entorno

Las siguientes variables ya están configuradas en tu archivo `.env`:

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_MICROSOFT_CLIENT_ID=2d4b4454-ccc4-4931-bc2e-7dcbac06b926
VITE_MICROSOFT_TENANT_ID=bf0b4836-49ef-44dc-986e-cc5e5fc3c7e0
```

---

## 🔄 Tipos de Autenticación Soportados

### 1. **Single-Tenant (Configuración Actual)**

- Requiere que los usuarios pertenezcan al tenant específico
- Mayor seguridad para aplicaciones empresariales
- Configurado en: `src/config/authConfig.js`

```javascript
authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID}`,
```

### 2. **Multi-Tenant (Alternativa)**

Si quieres permitir inicios de sesión desde cualquier organización de Microsoft:

1. Abre `src/config/authConfig.js`
2. Comenta la línea de single-tenant
3. Descomenta la línea de multi-tenant:

```javascript
// OPCIÓN 1: Single-tenant (requiere configuración en Azure)
// authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID}`,

// OPCIÓN 2: Multi-tenant (permite cualquier cuenta Microsoft)
authority: "https://login.microsoftonline.com/common",
```

---

## 🚀 Cómo Funciona

### Flujo de Autenticación Local

1. Usuario ingresa email y contraseña
2. Se envía a `/api/v1/auth/login`
3. Backend valida y retorna token JWT
4. Token se guarda en localStorage
5. Usuario es redirigido al Dashboard

### Flujo de Autenticación Microsoft

1. Usuario hace clic en "Continuar con Microsoft"
2. Se abre popup de Microsoft
3. Usuario autoriza permisos (User.Read, email, profile, openid)
4. Se obtiene access token de Microsoft
5. Access token se envía a `/api/v1/auth/microsoft`
6. Backend valida el token y crea/actualiza el usuario
7. Backend retorna token JWT de la aplicación
8. Token se guarda en localStorage
9. Usuario es redirigido al Dashboard

---

## 📅 Integración con Calendario

### Permisos Necesarios

Para acceder al calendario de Microsoft, se requieren los siguientes scopes:

```javascript
scopes: ["User.Read", "email", "profile", "openid", "Calendars.Read"];
```

### Cómo Usar

1. Inicia sesión con Microsoft
2. Ve a la sección "Calendario" en el menú
3. La primera vez, se pedirán permisos adicionales para calendario
4. Una vez autorizados, verás tus eventos del día
5. Puedes convertir reuniones en actividades

---

## 🔒 Seguridad

### Almacenamiento de Tokens

- **Token JWT**: Se guarda en `localStorage`
- **Token de Microsoft**: Se gestiona automáticamente por MSAL en `sessionStorage`
- **Datos de usuario**: Se guardan en `localStorage` como JSON

### Cierre de Sesión

Al cerrar sesión:

1. Se elimina el token JWT de localStorage
2. Se eliminan los datos de usuario
3. Si es usuario de Microsoft, se cierra sesión también en Microsoft
4. Usuario es redirigido al login

---

## ❌ Solución de Problemas

### Error: "AADSTS50011: The reply URL specified in the request does not match"

**Solución**: Verifica que en Azure AD Portal, la URL de redirección configurada sea:

- Desarrollo: `http://localhost:5173/auth/callback`
- Producción: `https://tu-dominio.com/auth/callback`

### Error: "AADSTS65001: The user or administrator has not consented"

**Solución**:

1. Cambia a multi-tenant en `authConfig.js`
2. O pide al administrador de Azure AD que pre-autorice la aplicación

### Error: "No hay sesión de Microsoft activa"

**Solución**: Este error aparece al intentar acceder al calendario sin haber iniciado sesión con Microsoft. Inicia sesión con Microsoft primero.

### Error: "InteractionRequiredAuthError"

**Solución**: Este error indica que el token ha expirado. La aplicación automáticamente abrirá un popup para renovar el token.

---

## 🧪 Pruebas

### Probar Login Local

```bash
# Credenciales por defecto
Email: admin@timeflow.com
Password: admin123
```

### Probar Login Microsoft

1. Haz clic en "Continuar con Microsoft"
2. Usa una cuenta Microsoft válida
3. Acepta los permisos solicitados
4. Deberías ser redirigido al Dashboard

### Probar Calendario

1. Inicia sesión con Microsoft
2. Navega a la sección "Calendario"
3. Verifica que se muestren tus eventos
4. Intenta convertir un evento en actividad

---

## 📚 Recursos Adicionales

- [Microsoft MSAL Documentation](https://github.com/AzureAD/microsoft-authentication-library-for-js)
- [Azure AD Portal](https://portal.azure.com/)
- [Microsoft Graph API](https://docs.microsoft.com/en-us/graph/overview)

---

## 💡 Consejos

1. **Desarrollo**: Usa single-tenant para mayor control
2. **Producción**: Considera multi-tenant si esperas usuarios de diferentes organizaciones
3. **Calendario**: Solo solicita permisos de calendario cuando el usuario acceda a esa sección
4. **Errores**: Revisa la consola del navegador para más detalles sobre errores de MSAL
5. **Tokens**: Los tokens de Microsoft expiran, MSAL los renueva automáticamente

---

¿Necesitas más ayuda? Revisa el archivo `MICROSOFT_AUTH_SETUP.md` para más detalles técnicos.
