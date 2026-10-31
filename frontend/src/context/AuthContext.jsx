import { createContext, useContext, useState } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null
    const token = sessionStorage.getItem('token')
    const userData = sessionStorage.getItem('user')

    if (token && userData && userData !== 'undefined') {
      try {
        return JSON.parse(userData)
      } catch {
        console.error('Corrupted auth data, clearing storage')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('user')
      }
    }
    return null
  })
  const [loading] = useState(false)

  const login = (data) => {
    sessionStorage.setItem('token', data.token)
    sessionStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  const logout = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('role')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
