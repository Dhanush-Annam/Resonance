import { createContext, useContext, useEffect, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

useEffect(() => {
  const token = sessionStorage.getItem('token')
  const userData = sessionStorage.getItem('user')

  if (token && userData && userData !== 'undefined') {
    try {
      setUser(JSON.parse(userData))
    } catch (error) {
      console.error('Corrupted auth data, clearing storage')
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    }
  }

  setLoading(false)
}, [])


  const login = (data) => {
    sessionStorage.setItem('token', data.token)
    sessionStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
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
