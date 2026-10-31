import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import { Search, LogOut } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined' && location.pathname === '/search') {
      return new URLSearchParams(location.search).get('q') || ''
    }
    return ''
  })

  // Adjust search query when URL search params or route changes (React idiomatic render-time synchronization)
  const currentSearchKey = location.pathname === '/search' ? (new URLSearchParams(location.search).get('q') || '') : ''
  const [prevSearchKey, setPrevSearchKey] = useState(currentSearchKey)
  const [prevPathname, setPrevPathname] = useState(location.pathname)

  if (prevPathname !== location.pathname || prevSearchKey !== currentSearchKey) {
    setPrevPathname(location.pathname)
    setPrevSearchKey(currentSearchKey)
    setQuery(currentSearchKey)
  }

  // Debounce search update when on /search page without history thrashing
  useEffect(() => {
    if (location.pathname !== '/search') return

    const timer = setTimeout(() => {
      const params = new URLSearchParams(location.search)
      const currentQ = params.get('q') || ''
      const trimmed = query.trim()

      if (trimmed !== currentQ) {
        if (trimmed) {
          navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: true })
        } else {
          navigate('/search', { replace: true })
        }
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, location.pathname, location.search, navigate])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const trimmed = query.trim()
    const isSearchRoute = location.pathname === '/search'

    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`, { replace: isSearchRoute })
    } else {
      navigate('/search', { replace: isSearchRoute })
    }
  }

  return (
    <header className="h-16 bg-canvas-base/90 backdrop-blur-md border-b border-border-rule flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20 select-none">
      {/* Brand Identity */}
      <Link
        to="/"
        className="flex items-center gap-2.5 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-base rounded-sm"
      >
        <div className="w-8 h-8 rounded-sm bg-surface-raised border border-border-rule flex items-center justify-center group-hover:border-border-control transition">
          <img
            src="/favicon-wave-blue.svg"
            alt="Resonance Logo"
            className="h-4.5 w-4.5 object-contain"
          />
        </div>
        <span className="text-text-primary font-serif text-lg tracking-normal">
          Resonance
        </span>
      </Link>

      {/* Global Search Bar (Hidden on mobile <768px, active on tablet/desktop >=768px) */}
      <form
        onSubmit={handleSearchSubmit}
        role="search"
        className="hidden md:flex relative flex-1 max-w-md mx-6"
      >
        <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="search"
          aria-label="Search tracks, artists, genres"
          placeholder="Search releases, artists, genres..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 rounded-sm bg-surface-raised border border-border-control text-xs sm:text-sm text-text-primary placeholder:text-text-tertiary font-sans focus-visible:outline-none focus-visible:border-border-focus focus-visible:ring-1 focus-visible:ring-border-focus transition"
        />
      </form>

      {/* Right User Actions & Mobile Search Quick Action */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Mobile Search Quick Action Trigger */}
        <Link
          to="/search"
          aria-label="Search"
          className="md:hidden p-2 rounded-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
        >
          <Search className="w-4 h-4" />
        </Link>

        {user ? (
          <>
            <div className="flex items-center gap-2 py-1 px-2.5 rounded-sm bg-surface-raised border border-border-rule">
              <div className="w-6 h-6 rounded-sm bg-surface-elevated border border-border-control text-text-primary flex items-center justify-center text-xs font-mono font-medium">
                {user.username ? user.username[0].toUpperCase() : 'U'}
              </div>
              <span className="text-xs text-text-primary font-medium hidden sm:inline">
                {user.username}
              </span>
              {user.role && user.role !== 'user' && (
                <span
                  className={`text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded-xs border hidden md:inline ${
                    user.role === 'admin'
                      ? 'bg-status-pending-bg text-status-pending-fg border-status-pending-bd'
                      : 'bg-accent-subtle text-accent-text border-accent-border'
                  }`}
                >
                  {user.role}
                </span>
              )}
            </div>

            <button
              onClick={handleLogout}
              title="Log out"
              aria-label="Log out"
              className="p-2 sm:p-1.5 min-w-9 min-h-9 sm:min-w-0 sm:min-h-0 flex items-center justify-center rounded-sm text-text-secondary hover:text-status-rejected-fg hover:bg-surface-hover border border-transparent hover:border-border-rule transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 focus-visible:ring-offset-canvas-base"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="text-xs sm:text-sm font-medium text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-sm hover:bg-surface-hover transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              Log in
            </Link>

            <Link
              to="/register"
              className="text-xs sm:text-sm font-medium bg-[#f5f2eb] text-[#101114] px-3.5 py-1.5 rounded-sm hover:bg-[#e2dfd7] active:scale-[0.98] transition font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
