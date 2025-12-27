import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLocation } from 'react-router-dom'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login } = useAuth()
  const location = useLocation()
  const from = location.state?.from || '/'


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/auth/login`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      }
    )

    const data = await res.json()
    localStorage.setItem('token', data.token)
    localStorage.setItem('role', data.user.role)

    if (!res.ok) {
      setError(data.message || 'Login failed')
      return
    }

    login(data)
    navigate(from)
  }

  return (
    <div className="flex-col bg-black flex items-center justify-center w-screen">
      <form
        onSubmit={handleSubmit}
        className="bg-zinc-900 p-6 rounded-lg w-96"
      >
        <h2 className="text-white text-xl mb-4">Login</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 bg-zinc-800 text-white rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 bg-zinc-800 text-white rounded"
        />

        <button
          className="w-full bg-green-600 hover:bg-green-500 text-white p-2 rounded"
        >
          Login
        </button>
      </form>
      <p className="text-sm text-gray-400 mt-4 text-center">
        Don&apos;t have an account?{' '}
        <Link
          to="/register"
          className="text-green-400 hover:underline"
        >
          Register
        </Link>
      </p>

    </div>
  )
}
