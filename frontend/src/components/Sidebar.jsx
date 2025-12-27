export default function Sidebar() {
  return (
    <div className="w-60 bg-black text-gray-300 p-4 hidden md:block">
      <h1 className="text-white text-xl font-bold mb-6">🎧 Resonance</h1>

      <nav className="space-y-3">
        <div className="hover:text-white cursor-pointer">🏠 Home</div>
        <div className="hover:text-white cursor-pointer">🔍 Search</div>
        <div className="hover:text-white cursor-pointer">📚 Library</div>
      </nav>
    </div>
  )
}
