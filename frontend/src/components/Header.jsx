import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { Search, LogOut, User, Shield, Mic2 } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState('')

  // Sync search input with URL search params if on /search page
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search)
      setQuery(params.get('q') || '')
    }
  }, [location])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <header className="h-16 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2.5 group shrink-0">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:border-emerald-500/60 transition">
          <img
            src="/favicon-wave-blue.svg"
            alt="Resonance Logo"
            className="h-5 w-5 object-contain filter drop-shadow"
          />
        </div>
        <span className="text-white font-bold text-base sm:text-lg tracking-tight group-hover:text-emerald-400 transition">
          Resonance
        </span>
      </Link>

      {/* Global Search Bar (Visible to everyone) */}
      <form
        onSubmit={handleSearchSubmit}
        className="relative flex-1 max-w-xs sm:max-w-md mx-3 sm:mx-6"
      >
        <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="What do you want to play?"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            navigate(`/search?q=${encodeURIComponent(e.target.value)}`)
          }}
          className="w-full pl-9 pr-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/30 transition"
        />
      </form>

      {/* Right User Actions */}
      {user ? (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 py-1 px-2.5 rounded-full bg-zinc-900 border border-zinc-800">
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-semibold">
              {user.username ? user.username[0].toUpperCase() : 'U'}
            </div>
            <span className="text-xs text-zinc-200 font-medium hidden sm:inline">
              {user.username}
            </span>
            {user.role && user.role !== 'user' && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden md:inline">
                {user.role}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-full text-zinc-400 hover:text-rose-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            to="/login"
            className="text-xs sm:text-sm font-semibold text-zinc-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-zinc-900 transition"
          >
            Log in
          </Link>

          <Link
            to="/register"
            className="text-xs sm:text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-1.5 rounded-full transition shadow-md shadow-emerald-950/40 hover:scale-105 active:scale-95"
          >
            Sign up
          </Link>
        </div>
      )}
    </header>
  )
}
