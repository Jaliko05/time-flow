import apiClient from "@/api/client";
import { msalInstance, loginRequest } from "@/config/authConfig";

class AuthService {
  // Login local con email/password
  async loginLocal(email, password) {
    try {
      const response = await apiClient.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        this.setSession(response.data.data.token, response.data.data.user);
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      throw new Error(
        error.response?.data?.message || error.response?.data?.error || "Error en login"
      );
    }
  }

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
      const response = await apiClient.post("/auth/microsoft", {
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
        try {
          const tokenResponse = await msalInstance.acquireTokenPopup(
            loginRequest
          );
          const response = await apiClient.post("/auth/microsoft", {
            access_token: tokenResponse.accessToken,
          });

          if (response.data.success) {
            this.setSession(response.data.data.token, response.data.data.user);
            return response.data.data;
          }
        } catch (retryError) {
          throw new Error(
            retryError.response?.data?.message || "Error en login con Microsoft"
          );
        }
      }
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Error en login con Microsoft"
      );
    }
  }

  // Registro
  async register(userData) {
    try {
      const response = await apiClient.post("/auth/register", userData);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message);
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Error en registro"
      );
    }
  }

  // Obtener usuario actual
  async getCurrentUser() {
    try {
      const response = await apiClient.get("/auth/me");
      return response.data.data;
    } catch (error) {
      throw new Error("Error obteniendo usuario actual");
    }
  }

  // Logout mejorado (incluye Microsoft)
  async logout() {
    const user = this.getUser();

    // Si es usuario de Microsoft, cerrar sesión en Microsoft también
    if (user?.auth_provider === "microsoft") {
      const accounts = msalInstance.getAllAccounts();
      if (accounts.length > 0) {
        try {
          await msalInstance.logoutPopup({
            account: accounts[0],
          });
        } catch (error) {
          console.error("Error cerrando sesión de Microsoft:", error);
        }
      }
    }

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
