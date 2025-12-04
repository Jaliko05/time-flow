# 🎨 Frontend Implementation Guide

Guía completa para implementar el frontend de TimeFlow con autenticación dual (Local + Microsoft) e integración con Calendar.

---

## 📋 Tabla de Contenidos

1. [Instalación](#-instalación)
2. [Configuración](#-configuración)
3. [Autenticación Local](#-autenticación-local)
4. [Autenticación Microsoft](#-autenticación-microsoft)
5. [Integración con Calendar](#-integración-con-calendar)
6. [Ejemplos de Componentes](#-ejemplos-de-componentes)
7. [Manejo de Errores](#-manejo-de-errores)

---

## 📦 Instalación

### Dependencias Necesarias

```bash
# React (si no lo tienes)
npx create-react-app timeflow-frontend
cd timeflow-frontend

# MSAL para Microsoft OAuth
npm install @azure/msal-browser @azure/msal-react

# HTTP Client
npm install axios

# Routing
npm install react-router-dom
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Crea `.env` en la raíz del proyecto:

```env
REACT_APP_API_URL=http://localhost:8080/api/v1
REACT_APP_MICROSOFT_CLIENT_ID=2d4b4454-ccc4-4931-bc2e-7dcbac06b926
REACT_APP_MICROSOFT_TENANT_ID=bf0b4836-49ef-44dc-986e-cc5e5fc3c7e0
```

### 2. Configuración MSAL

Crea `src/config/authConfig.js`:

```javascript
import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: process.env.REACT_APP_MICROSOFT_CLIENT_ID,
    // OPCIÓN 1: Single-tenant (requiere configuración en Azure)
    authority: `https://login.microsoftonline.com/${process.env.REACT_APP_MICROSOFT_TENANT_ID}`,

    // OPCIÓN 2: Multi-tenant (si no tienes permisos de admin)
    // authority: "https://login.microsoftonline.com/common",

    redirectUri: window.location.origin + "/auth/callback",
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        switch (level) {
          case LogLevel.Error:
            console.error(message);
            return;
          case LogLevel.Warning:
            console.warn(message);
            return;
        }
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Scopes para login básico
export const loginRequest = {
  scopes: ["User.Read", "email", "profile", "openid"],
};

// Scopes para calendario (agregar si necesitas integración con calendar)
export const calendarRequest = {
  scopes: ["User.Read", "email", "profile", "openid", "Calendars.Read"],
};
```

### 3. Configuración Axios

Crea `src/config/axios.js`:

```javascript
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8080/api/v1";

axios.defaults.baseURL = API_URL;

// Interceptor: Agregar token a todas las peticiones
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Manejar errores de autenticación
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axios;
```

---

## 🔐 Autenticación Local

### Servicio de Autenticación

Crea `src/services/authService.js`:

```javascript
import axios from "axios";

class AuthService {
  // Login local con email/password
  async loginLocal(email, password) {
    try {
      const response = await axios.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        this.setSession(response.data.data.token, response.data.data.user);
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error en login");
    }
  }

  // Registro
  async register(userData) {
    try {
      const response = await axios.post("/auth/register", userData);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      throw new Error(error.response?.data?.message || "Error en registro");
    }
  }

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const response = await axios.get("/auth/me");
      return response.data.data;
    } catch (error) {
      throw new Error("Error obteniendo usuario actual");
    }
  }

  // Logout
  logout() {
    this.clearSession();
    window.location.href = "/login";
  }

  // Guardar sesión
  setSession(token, user) {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
  }

  // Limpiar sesión
  clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  // Verificar autenticación
  isAuthenticated() {
    return !!localStorage.getItem("token");
  }

  // Obtener usuario guardado
  getUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }
}

export default new AuthService();
```

### Componente de Login Local

Crea `src/components/Login.jsx`:

```jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.loginLocal(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>TimeFlow</h1>
          <p>Inicia sesión en tu cuenta</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
```

---

## 🔵 Autenticación Microsoft

### Extender el Servicio de Autenticación

Actualiza `src/services/authService.js`:

```javascript
import { msalInstance, loginRequest } from "../config/authConfig";

class AuthService {
  // ... código anterior ...

  // Login con Microsoft
  async loginMicrosoft() {
    try {
      // Paso 1: Login popup con Microsoft
      const loginResponse = await msalInstance.loginPopup(loginRequest);

      // Paso 2: Adquirir token silenciosamente
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...loginRequest,
        account: loginResponse.account,
      });

      // Paso 3: Enviar token a backend
      const response = await axios.post("/auth/microsoft", {
        access_token: tokenResponse.accessToken,
      });

      if (response.data.success) {
        this.setSession(response.data.data.token, response.data.data.user);
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      // Si falla el token silencioso, intentar con popup
      if (error.name === "InteractionRequiredAuthError") {
        const tokenResponse = await msalInstance.acquireTokenPopup(
          loginRequest
        );
        const response = await axios.post("/auth/microsoft", {
          access_token: tokenResponse.accessToken,
        });

        if (response.data.success) {
          this.setSession(response.data.data.token, response.data.data.user);
          return response.data.data;
        }
      }
      throw new Error(
        error.response?.data?.message || "Error en login con Microsoft"
      );
    }
  }

  // Logout mejorado (incluye Microsoft)
  async logout() {
    const user = this.getUser();

    // Si es usuario de Microsoft, cerrar sesión en Microsoft también
    if (user?.auth_provider === "microsoft") {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        await msalInstance.logoutPopup({
          account: accounts[0],
        });
      }
    }

    this.clearSession();
    window.location.href = "/login";
  }
}
```

### Actualizar Componente de Login

Actualiza `src/components/Login.jsx`:

```jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { msalInstance } from "../config/authConfig";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Inicializar MSAL
    msalInstance.initialize();
  }, []);

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authService.loginLocal(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setError("");
    setLoading(true);

    try {
      await authService.loginMicrosoft();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>TimeFlow</h1>
          <p>Inicia sesión en tu cuenta</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleLocalLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>

        <div className="divider">
          <span>O</span>
        </div>

        <button
          onClick={handleMicrosoftLogin}
          className="btn btn-microsoft"
          disabled={loading}
        >
          <svg className="microsoft-icon" viewBox="0 0 21 21">
            <rect x="1" y="1" width="9" height="9" fill="#f25022" />
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
            <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
            <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
          </svg>
          Continuar con Microsoft
        </button>

        <div className="login-footer">
          <p>
            ¿No tienes cuenta? <a href="/register">Regístrate</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
```

### CSS para Login

Crea `src/components/Login.css`:

```css
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  padding: 40px;
  width: 100%;
  max-width: 420px;
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.login-header h1 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 32px;
}

.login-header p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.alert {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 20px;
  font-size: 14px;
}

.alert-error {
  background-color: #fee;
  color: #c33;
  border: 1px solid #fcc;
}

.login-form {
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-microsoft {
  background: white;
  color: #5e5e5e;
  border: 1px solid #ddd;
}

.btn-microsoft:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #ccc;
}

.microsoft-icon {
  width: 20px;
  height: 20px;
}

.divider {
  position: relative;
  text-align: center;
  margin: 24px 0;
}

.divider::before {
  content: "";
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #ddd;
}

.divider span {
  position: relative;
  background: white;
  padding: 0 16px;
  color: #999;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
}

.login-footer p {
  color: #666;
  font-size: 14px;
}

.login-footer a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}
```

---

## 📅 Integración con Calendar

### Actualizar Scopes de MSAL

En `src/config/authConfig.js`, ya tienes `calendarRequest` con los scopes necesarios.

### Servicio de Calendario

Crea `src/services/calendarService.js`:

```javascript
import axios from "axios";
import { msalInstance, calendarRequest } from "../config/authConfig";

class CalendarService {
  // Obtener access token de Microsoft con scopes de calendario
  async getMicrosoftToken() {
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      throw new Error("No hay sesión de Microsoft activa");
    }

    try {
      const tokenResponse = await msalInstance.acquireTokenSilent({
        ...calendarRequest,
        account: accounts[0],
      });
      return tokenResponse.accessToken;
    } catch (error) {
      if (error.name === "InteractionRequiredAuthError") {
        const tokenResponse = await msalInstance.acquireTokenPopup(
          calendarRequest
        );
        return tokenResponse.accessToken;
      }
      throw error;
    }
  }

  // Obtener eventos de hoy
  async getTodayEvents() {
    try {
      const accessToken = await this.getMicrosoftToken();
      const response = await axios.post("/calendar/today", {
        access_token: accessToken,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error obteniendo eventos"
      );
    }
  }

  // Obtener eventos en rango de fechas
  async getEvents(startDate, endDate) {
    try {
      const accessToken = await this.getMicrosoftToken();
      const response = await axios.post("/calendar/events", {
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error obteniendo eventos"
      );
    }
  }
}

export default new CalendarService();
```

### Componente de Calendario

Crea `src/components/CalendarEvents.jsx`:

```jsx
import React, { useState, useEffect } from "react";
import calendarService from "../services/calendarService";
import axios from "axios";
import "./CalendarEvents.css";

function CalendarEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activityData, setActivityData] = useState({
    hours: 0,
    description: "",
    activity_type: "teams",
    notes: "",
  });

  const fetchEvents = async () => {
    setLoading(true);
    setError("");

    try {
      const events = await calendarService.getTodayEvents();
      setEvents(events);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openActivityModal = (event) => {
    setSelectedEvent(event);
    const locationInfo = event.location ? `📍 ${event.location}` : "";
    const onlineInfo = event.is_online ? "📹 Reunión online" : "";

    setActivityData({
      hours: event.duration_hours,
      description: event.subject,
      activity_type: "teams",
      notes: `📅 ${event.subject}\n${locationInfo}\n${onlineInfo}\n\n${
        event.description || ""
      }`.trim(),
    });

    setShowModal(true);
  };

  const createActivity = async () => {
    try {
      await axios.post("/activities", {
        date: selectedEvent.start_time.split("T")[0],
        hours: activityData.hours,
        description: activityData.description,
        activity_type: activityData.activity_type,
        notes: activityData.notes,
        project_id: null,
      });

      alert("✅ Actividad creada exitosamente!");
      setShowModal(false);
      setSelectedEvent(null);

      setEvents(
        events.map((e) =>
          e.id === selectedEvent.id ? { ...e, converted: true } : e
        )
      );
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.message || err.message));
    }
  };

  const adjustHours = (delta) => {
    setActivityData({
      ...activityData,
      hours: Math.max(0, activityData.hours + delta),
    });
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) {
    return (
      <div className="calendar-loading">
        <div className="spinner"></div>
        <p>Cargando eventos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendar-error">
        <p>{error}</p>
        <button onClick={fetchEvents} className="btn-retry">
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="calendar-events">
      <div className="calendar-header">
        <h2>📅 Mis Reuniones de Hoy</h2>
        <button onClick={fetchEvents} className="btn-refresh">
          🔄 Actualizar
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>No hay reuniones programadas para hoy</p>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <div
              key={event.id}
              className={`event-card ${event.converted ? "converted" : ""}`}
            >
              <div className="event-time-badge">
                🕐{" "}
                {new Date(event.start_time).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>

              <div className="event-content">
                <h3>{event.subject}</h3>
                <p>
                  ⏱️ {event.duration_hours.toFixed(2)}h
                  {event.is_online && <span className="badge">📹 Online</span>}
                </p>
                {event.location && <p>📍 {event.location}</p>}
                {event.description && (
                  <p className="description">{event.description}</p>
                )}
              </div>

              <button
                onClick={() => openActivityModal(event)}
                className="btn-convert"
                disabled={event.converted}
              >
                {event.converted ? "✓ Convertida" : "➕ Agregar como Actividad"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Crear Actividad</h3>
              <button onClick={() => setShowModal(false)} className="btn-close">
                ✖
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  value={activityData.description}
                  onChange={(e) =>
                    setActivityData({
                      ...activityData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>⏱️ Duración Real</label>
                <div className="duration-adjuster">
                  <button onClick={() => adjustHours(-0.25)} type="button">
                    -15min
                  </button>
                  <button onClick={() => adjustHours(-0.5)} type="button">
                    -30min
                  </button>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    value={activityData.hours}
                    onChange={(e) =>
                      setActivityData({
                        ...activityData,
                        hours: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                  <span>horas</span>
                  <button onClick={() => adjustHours(0.25)} type="button">
                    +15min
                  </button>
                  <button onClick={() => adjustHours(0.5)} type="button">
                    +30min
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Tipo de Actividad</label>
                <select
                  value={activityData.activity_type}
                  onChange={(e) =>
                    setActivityData({
                      ...activityData,
                      activity_type: e.target.value,
                    })
                  }
                >
                  <option value="teams">📹 Teams</option>
                  <option value="sesion">👥 Sesión</option>
                  <option value="plan_de_trabajo">📋 Plan de Trabajo</option>
                  <option value="investigacion">🔍 Investigación</option>
                </select>
              </div>

              <div className="form-group">
                <label>Notas</label>
                <textarea
                  value={activityData.notes}
                  onChange={(e) =>
                    setActivityData({ ...activityData, notes: e.target.value })
                  }
                  rows="4"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowModal(false)}
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button
                onClick={createActivity}
                className="btn-save"
                disabled={!activityData.description || activityData.hours === 0}
              >
                💾 Crear Actividad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CalendarEvents;
```

---

## 🛡️ Ruta Protegida

Crea `src/components/ProtectedRoute.jsx`:

```jsx
import React from "react";
import { Navigate } from "react-router-dom";
import authService from "../services/authService";

function ProtectedRoute({ children, roles = [] }) {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;
```

---

## 🚀 App Principal

Actualiza `src/App.jsx`:

```jsx
import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { msalInstance } from "./config/authConfig";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import CalendarEvents from "./components/CalendarEvents";
import ProtectedRoute from "./components/ProtectedRoute";
import "./config/axios";

function App() {
  useEffect(() => {
    msalInstance.initialize();
  }, []);

  return (
    <BrowserRouter>
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

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarEvents />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

## ❌ Manejo de Errores

### Errores Comunes

**1. "No hay sesión de Microsoft activa"**

- Usuario no ha iniciado sesión con Microsoft
- Redirigir a login o pedir reautenticación

**2. "InteractionRequiredAuthError"**

- Token expirado
- Usar `acquireTokenPopup` para renovar

**3. "Error 401 - Unauthorized"**

- JWT inválido o expirado
- Limpiar sesión y redirigir a login

**4. "Permisos de calendario no otorgados"**

- Usuario no autorizó `Calendars.Read`
- Pedir permisos nuevamente con popup

---

## ✅ Checklist de Implementación

- [ ] Instalar dependencias (`@azure/msal-browser`, `axios`, `react-router-dom`)
- [ ] Configurar `.env` con Client ID y Tenant ID
- [ ] Crear `authConfig.js` con configuración MSAL
- [ ] Configurar interceptores de Axios
- [ ] Implementar `authService.js`
- [ ] Crear componente `Login.jsx` con ambos métodos
- [ ] Crear `ProtectedRoute.jsx`
- [ ] Implementar `calendarService.js`
- [ ] Crear componente `CalendarEvents.jsx`
- [ ] Probar login local
- [ ] Probar login Microsoft
- [ ] Probar integración con calendario

---

## 📚 Recursos

- [Microsoft MSAL React](https://github.com/AzureAD/microsoft-authentication-library-for-js/tree/dev/lib/msal-react)
- [Axios Documentation](https://axios-http.com/docs/intro)
- [React Router](https://reactrouter.com/)
- [API Documentation](./API.md)
