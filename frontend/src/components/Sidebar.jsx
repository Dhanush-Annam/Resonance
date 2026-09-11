import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Home, Search, Library, Mic2, Shield, PlusCircle } from 'lucide-react'

export default function Sidebar() {
  const { user } = useAuth()

  const navClass = ({ isActive }) =>
    `flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-zinc-800/90 text-white font-semibold shadow-sm border border-zinc-700/60'
        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
    }`

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/80 p-4 hidden md:flex flex-col justify-between select-none">
      <div className="space-y-6">
        {/* Main Navigation */}
        <nav className="space-y-1.5 flex flex-col">
          <NavLink to="/" className={navClass}>
            <Home className="w-5 h-5" />
            <span>Home</span>
          </NavLink>

          <NavLink to="/search" className={navClass}>
            <Search className="w-5 h-5" />
            <span>Search</span>
          </NavLink>

          <NavLink to="/library" className={navClass}>
            <Library className="w-5 h-5" />
            <span>Your Library</span>
          </NavLink>
        </nav>

        {/* Creator / Admin Section */}
        {(user?.role === 'artist' || user?.role === 'admin') && (
          <div className="pt-4 border-t border-zinc-800/80">
            <p className="px-3 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
              Management
            </p>

            <div className="space-y-1.5 flex flex-col">
              {user?.role === 'artist' && (
                <NavLink to="/artist" className={navClass}>
                  <Mic2 className="w-5 h-5 text-emerald-400" />
                  <span>Artist Studio</span>
                </NavLink>
              )}

              {user?.role === 'admin' && (
                <>
                  <NavLink to="/admin" className={navClass}>
                    <Shield className="w-5 h-5 text-indigo-400" />
                    <span>Admin Panel</span>
                  </NavLink>
                  <NavLink to="/admin/create" className={navClass}>
                    <PlusCircle className="w-5 h-5 text-emerald-400" />
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
