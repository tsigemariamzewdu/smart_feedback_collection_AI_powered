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

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post("/auth/register", userData)
      const { token, user } = response.data

      localStorage.setItem("token", token)
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`
      setUser(user)

      return { success: true }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
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
    logout,
    isAuthenticated: !!user,
    isChef: user?.role === "chef",
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
