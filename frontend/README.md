# Frontend - Time Flow

> ⚠️ **Nota**: Este archivo contiene información básica. Para documentación completa, ver [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🚀 Inicio Rápido

### Requisitos

- Node.js 18+
- pnpm

### Instalación

```bash
cd frontend
pnpm install
```

### Configuración

Crear archivo `.env`:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_MICROSOFT_CLIENT_ID=tu_client_id
VITE_MICROSOFT_TENANT_ID=tu_tenant_id
VITE_MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Ejecutar

```bash
pnpm dev
```

**URL:** http://localhost:5173

### Build

```bash
pnpm build
```

## 📚 Documentación Completa

Ver [DOCUMENTATION.md](./DOCUMENTATION.md) para:

- Arquitectura detallada
- Sistema de autenticación (Local + Microsoft)
- Componentes principales
- Hooks personalizados
- Integración con Microsoft Calendar
- API Cliente
- Guía de deployment
- Troubleshooting
