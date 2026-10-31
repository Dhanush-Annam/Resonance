import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Search, Library, Mic2, Shield, PlusCircle } from 'lucide-react'

export default function Sidebar() {
  const { user } = useAuth()

  const navClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 rounded-sm text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 focus-visible:ring-offset-canvas-base ${
      isActive
        ? 'bg-surface-raised text-text-primary font-medium border border-border-rule shadow-sm'
        : 'text-text-secondary border border-transparent hover:text-text-primary hover:bg-surface-raised/60'
    }`

  return (
    <aside className="w-50 lg:w-60 shrink-0 bg-canvas-base border-r border-border-rule p-3 lg:p-4 hidden md:flex flex-col justify-between select-none">
      <div className="space-y-6">
        {/* Main Navigation */}
        <nav className="space-y-1 flex flex-col" aria-label="Main Navigation">
          <NavLink to="/" end className={navClass}>
            <Home className="w-4 h-4 shrink-0" />
            <span>Home</span>
          </NavLink>

          <NavLink to="/search" className={navClass}>
            <Search className="w-4 h-4 shrink-0" />
            <span>Search</span>
          </NavLink>

          <NavLink to="/library" className={navClass}>
            <Library className="w-4 h-4 shrink-0" />
            <span>Your Library</span>
          </NavLink>
        </nav>

        {/* Creator / Admin Section */}
        {(user?.role === 'artist' || user?.role === 'admin') && (
          <div className="pt-4 border-t border-border-rule">
            <p className="px-3 text-[11px] font-mono font-medium text-text-tertiary uppercase tracking-wider mb-2">
              Management
            </p>

            <div className="space-y-1 flex flex-col" aria-label="Management Navigation">
              {user?.role === 'artist' && (
                <NavLink to="/artist" className={navClass}>
                  <Mic2 className="w-4 h-4 shrink-0 text-accent-text" />
                  <span>Artist Studio</span>
                </NavLink>
              )}

              {user?.role === 'admin' && (
                <>
                  <NavLink to="/admin" end className={navClass}>
                    <Shield className="w-4 h-4 shrink-0 text-status-pending-fg" />
                    <span>Curatorial Desk</span>
                  </NavLink>
                  <NavLink to="/admin/create" className={navClass}>
                    <PlusCircle className="w-4 h-4 shrink-0 text-status-approved-fg" />
                    <span>Upload Track</span>
                  </NavLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
