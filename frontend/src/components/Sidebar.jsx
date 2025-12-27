import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <div className="w-60 bg-black text-gray-300 p-4 hidden md:block">
      <h1 className="text-white text-xl font-bold mb-6">🎧 Resonance</h1>

      <nav className="space-y-3">
        <NavLink
          to="/"
          className={({ isActive }) =>
            isActive ? 'text-white font-semibold' : 'hover:text-white'
          }
        >
          🏠 Home
        </NavLink>

        <NavLink
          to="/search"
          className={({ isActive }) =>
            isActive ? 'text-white font-semibold' : 'hover:text-white'
          }
        >
          🔍 Search
        </NavLink>

        <NavLink
          to="/library"
          className={({ isActive }) =>
            isActive ? 'text-white font-semibold' : 'hover:text-white'
          }
        >
          📚 Library
        </NavLink>
      </nav>
    </div>
  )
}
