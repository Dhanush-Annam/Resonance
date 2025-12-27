import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const token = localStorage.getItem('token')
  const userData = localStorage.getItem('user')

  if (token && userData && userData !== 'undefined') {
    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error('Corrupted auth data, clearing storage')
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  setLoading(false)
}, [])


  const login = (data) => {
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
