export default function Header({ searchTerm, setSearchTerm }) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-900">
      <h2 className="text-xl font-semibold text-white">Home</h2>

      <input
        type="text"
        placeholder="Search songs, artists, genres"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-zinc-800 text-white px-3 py-2 rounded-md w-72 focus:outline-none focus:ring focus:ring-green-500"
      />
    </div>
  )
}
