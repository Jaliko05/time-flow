import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "@/api";
import authService from "@/services/authService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const userData = await authAPI.me();
      setUser(userData);
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    if (response.token) {
      localStorage.setItem("token", response.token);
      const userData = await authAPI.me();
      setUser(userData);
    }
    return response;
  };

  const loginMicrosoft = async () => {
    const response = await authService.loginMicrosoft();
    console.log("Microsoft login response:", response);
    console.log("User from response:", response.user);
    if (response.user) {
      console.log("Setting user:", response.user);
      setUser(response.user);
    }
    return response;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    loginMicrosoft,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
