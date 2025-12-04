import { PublicClientApplication, LogLevel } from "@azure/msal-browser";

export const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
    // OPCIÓN 1: Single-tenant (requiere configuración en Azure)
    authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID}`,
    
    // OPCIÓN 2: Multi-tenant (si no tienes permisos de admin, descomenta esta línea y comenta la anterior)
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
          case LogLevel.Info:
            console.info(message);
            return;
          case LogLevel.Verbose:
            console.debug(message);
            return;
        }
      },
    },
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

// Scopes para login básico (incluye calendario desde el inicio)
export const loginRequest = {
  scopes: ["User.Read", "Calendars.Read"],
};

// Scopes para calendario (mismo que loginRequest)
export const calendarRequest = {
  scopes: ["User.Read", "Calendars.Read"],
};
