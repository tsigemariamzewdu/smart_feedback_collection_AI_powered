"use client"

import { createContext, useState, useContext, useEffect } from "react"
import api from "../services/api.jsx"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const checkLoggedIn = async () => {
      const token = localStorage.getItem("token")

      if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`
        try {
          const response = await api.get("/users/me")
          setUser(response.data)
        } catch (error) {
          console.error("Authentication error:", error)
          localStorage.removeItem("token")
        }
      }

      setLoading(false)
    }

    checkLoggedIn()
  }, [])

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password })
      const { token, user } = response.data

      localStorage.setItem("token", token)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      return {
        success: true,
        role: user.role, // Return role for redirection
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  }

// In the register function, update to send phone:
const register = async (userData) => {
  try {
    // Force role to customer and include phone
    const userDataWithRole = {
      ...userData,
      role: "customer",
      phone: userData.phone || "" // Ensure phone is included
    };

    const response = await api.post("/auth/register", userDataWithRole);
    const { token, user } = response.data;

    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(user);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || "Registration failed",
    };
  }
};

  const addChef = async (chefData) => {
    try {
      // Only admin can add chefs
      if (user?.role !== "admin") {
        return {
          success: false,
          message: "Unauthorized: Only admins can add chefs",
        }
      }

      const chefDataWithRole = {
        ...chefData,
        role: "chef",
      }

      const response = await api.post("/users", chefDataWithRole)

      return {
        success: true,
        chef: response.data,
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Failed to add chef",
      }
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    delete api.defaults.headers.common["Authorization"]
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    register,
    addChef,
    logout,
    isAuthenticated: !!user,
    isCustomer: user?.role === "customer",
    isChef: user?.role === "chef",
    isAdmin: user?.role === "admin",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
