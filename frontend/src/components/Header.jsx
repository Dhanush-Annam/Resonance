import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')


  const handleLogout = () => {
    logout()
    navigate('/login')
  }
  return (
    <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-6">
      <Link
        to="/"
      >
      <h1 className="text-white font-bold text-lg">
        🎧 Resonance
      </h1>
      </Link>
      {user && (
        <input
          type="text"
          placeholder="Search songs or artists"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            navigate(`/search?q=${encodeURIComponent(e.target.value)}`)
          }}
          className="w-80 px-4 py-1.5 rounded-full bg-zinc-800 text-sm text-white placeholder-gray-400 focus:outline-none"
        />
      )}

      {user ? (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300">
            {user.username}
          </span>

          <button
            onClick={handleLogout}
            className="text-sm bg-red-600 hover:bg-red-500 px-3 py-1 rounded"
          >
            Logout
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-gray-300 hover:text-white"
          >
            Login
          </Link>

          <Link
            to="/register"
            className="text-sm bg-green-600 hover:bg-green-500 px-3 py-1 rounded"
          >
            Register
          </Link>
        </div>
      )}
    </div>
  )
}
