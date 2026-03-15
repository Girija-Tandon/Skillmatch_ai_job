// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on app load
  useEffect(() => {
    const token = localStorage.getItem('sma_token')
    if (!token) { setLoading(false); return }

    authAPI.getMe()
      .then(res => setUser(res.data.user))
      .catch(err => {
        // Only clear token on 401 (invalid/expired), NOT on network errors
        if (err.response?.status === 401) {
          localStorage.removeItem('sma_token')
        }
        // If backend is temporarily down, keep the token and try again later
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const { data } = await authAPI.login({ email, password })
    localStorage.setItem('sma_token', data.token)
    setUser(data.user)
    return data.user
  }

  const register = async (payload) => {
    const { data } = await authAPI.register(payload)
    localStorage.setItem('sma_token', data.token)
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try { await authAPI.logout() } catch {}
    localStorage.removeItem('sma_token')
    setUser(null)
  }

  const updateProfile = async (payload) => {
    const res = await authAPI.updateProfile(payload)
    setUser(res.data.user)
    return res.data.user
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, register, logout, updateProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
