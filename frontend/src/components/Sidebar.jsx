import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Sidebar() {
  const { user } = useAuth()

  return (
    <div className="w-60 bg-black text-gray-300 p-4 hidden md:block">
      {/* <h1 className="text-white text-xl font-bold mb-6">🎧 Resonance</h1> */}

      <nav className="space-y-3 flex flex-col">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive
              ? 'text-white font-semibold'
              : 'hover:text-white'
          }
        >
          🏠 Home
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            isActive
              ? 'text-white font-semibold'
              : 'hover:text-white'
          }
        >
          🔍 Search
        </NavLink>

        <NavLink
          to="/library"
          className={({ isActive }) =>
            isActive
              ? 'text-white font-semibold'
              : 'hover:text-white'
          }
        >
          📚 Library
        </NavLink>

        {/* ARTIST ONLY */}
        {user?.role === 'artist' && (
          <NavLink
            to="/artist"
            className={({ isActive }) =>
              isActive
                ? 'text-white font-semibold'
                : 'hover:text-white'
            }
          >
            🎤 Artist Dashboard
          </NavLink>
        )}

        {/* ADMIN ONLY */}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive
                ? 'text-white font-semibold'
                : 'hover:text-white'
            }
          >
            🛡 Admin Dashboard
          </NavLink>
        )}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin/create"
            className="text-gray-300 hover:text-white"
          >
            ➕ Add Track
          </NavLink>
        )}

      </nav>
    </div>
  )
}
