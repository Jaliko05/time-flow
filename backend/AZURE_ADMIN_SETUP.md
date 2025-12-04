# 🔐 Configuración de Azure AD para TimeFlow

**Destinatario:** Administrador de Azure Active Directory  
**Aplicación:** TimeFlow  
**Client ID:** `2d4b4454-ccc4-4931-bc2e-7dcbac06b926`  
**Tenant ID:** `bf0b4836-49ef-44dc-986e-cc5e5fc3c7e0`

---

## 📋 Problema Actual

Los usuarios reciben el mensaje:

> "Se necesita la aprobación del administrador. Solo un administrador puede conceder permiso para esta aplicación."

Esto ocurre porque la aplicación está configurada de forma restrictiva en Azure AD.

---

## ✅ Solución (5 minutos)

### 1. Acceder a Azure Portal

1. Ir a: https://portal.azure.com
2. Azure Active Directory → App registrations
3. Buscar: **time-flow** (Client ID: `2d4b4454-ccc4-4931-bc2e-7dcbac06b926`)

---

### 2. Configurar API Permissions

**a) Ve a "API permissions"**

**b) Elimina permisos incorrectos si existen:**

- Si algún permiso es de tipo "Application" → Eliminar

**c) Agrega los siguientes permisos como "Delegated":**

| API             | Permission     | Type      | Admin Consent Required |
| --------------- | -------------- | --------- | ---------------------- |
| Microsoft Graph | User.Read      | Delegated | No                     |
| Microsoft Graph | Calendars.Read | Delegated | No                     |
| Microsoft Graph | email          | Delegated | No                     |
| Microsoft Graph | openid         | Delegated | No                     |
| Microsoft Graph | profile        | Delegated | No                     |

**d) Conceder consentimiento de administrador:**

- Click en **"Grant admin consent for [organización]"**
- Confirmar con **"Yes"**

---

### 3. Configurar Authentication

**a) Ve a "Authentication"**

**b) Platform configurations → Add a platform → Web:**

**Redirect URIs:**

```
http://localhost:3000/auth/callback
https://tudominio.com/auth/callback
```

**Logout URL:**

```
http://localhost:3000
https://tudominio.com
```

**c) Implicit grant and hybrid flows:**

- ✅ Access tokens (for implicit flows)
- ✅ ID tokens (for implicit and hybrid flows)

**d) Supported account types:**

- Seleccionar: **"Accounts in this organizational directory only (Single tenant)"**

---

### 4. Verificar Manifest (Opcional)

**a) Ve a "Manifest"**

**b) Verifica que contenga:**

```json
{
  "oauth2AllowImplicitFlow": true,
  "oauth2AllowIdTokenImplicitFlow": true,
  "signInAudience": "AzureADMyOrg"
}
```

---

### 5. Configurar Owners (Recomendado)

**a) Ve a "Owners"**

**b) Agrega a los desarrolladores/usuarios que necesiten gestionar la app:**

- Esto permite que ellos puedan ver la configuración (no modificarla)

---

## 🔍 Verificación

Después de estos cambios, los usuarios deberían poder:

1. **Iniciar sesión con Microsoft** sin pedir aprobación de admin
2. **Autorizar permisos** (User.Read, Calendars.Read) por sí mismos
3. **Acceder al calendario** desde la aplicación TimeFlow

---

## ❓ Preguntas Frecuentes

### ¿Por qué se necesita Calendars.Read?

La aplicación TimeFlow permite a los usuarios sincronizar sus reuniones de Microsoft Calendar y convertirlas en actividades de trabajo rastreables.

### ¿Es seguro dar estos permisos?

Sí. Todos los permisos son:

- **Delegated** (solo cuando el usuario inicia sesión)
- **NO requieren admin consent** (el usuario autoriza por sí mismo)
- **Scope limitado** (solo calendario del usuario, no de toda la organización)

### ¿Qué pasa si no concedo admin consent?

Cada usuario verá un popup pidiendo autorización la primera vez que use la app. Si concedes admin consent, ese popup no aparecerá.

---

## 📞 Contacto

Si tienes dudas sobre esta configuración:

- **Email:** javier.puentes@sistemasgyg.com
- **Aplicación:** TimeFlow Backend API

---

## 📚 Referencias

- [Microsoft Graph Permissions Reference](https://learn.microsoft.com/en-us/graph/permissions-reference)
- [Azure AD App Registration](https://learn.microsoft.com/en-us/azure/active-directory/develop/quickstart-register-app)
- [Delegated vs Application Permissions](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-permissions-and-consent)
