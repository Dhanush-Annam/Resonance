import { useNavigate } from 'react-router-dom'

export default function Library({ likedCount = 0, recentCount = 0, playlists = [] }) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 bg-black text-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Your Library</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Liked Songs */}
        <div
          className="p-4 bg-zinc-900 rounded cursor-pointer hover:bg-zinc-800"
          onClick={() => navigate('/library/liked')}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">❤️</div>
            <div>
              <p className="font-semibold">Liked Songs</p>
              <p className="text-sm text-gray-400">{likedCount} songs</p>
            </div>
          </div>
        </div>

        {/* Recently Played */}
        <div
          className="p-4 bg-zinc-900 rounded cursor-pointer hover:bg-zinc-800"
          onClick={() => navigate('/library/recent')}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">🕒</div>
            <div>
              <p className="font-semibold">Recently Played</p>
              <p className="text-sm text-gray-400">{recentCount} songs</p>
            </div>
          </div>
        </div>

        {/* Playlists */}
        {playlists.map((p) => (
          <div
            key={p._id}
            className="p-4 bg-zinc-900 rounded cursor-pointer hover:bg-zinc-800"
            onClick={() => navigate(`/library/playlists/${p._id}`)}
          >
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎵</div>
              <div>
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-gray-400">{p.trackCount} songs</p>
              </div>
            </div>
          </div>
        ))}

        {/* Create Playlist */}
        <div
          className="p-4 bg-zinc-900 rounded cursor-pointer hover:bg-zinc-800"
          onClick={() => navigate('/library/playlists/new')}
        >
          <div className="flex items-center gap-3">
            <div className="text-2xl">➕</div>
            <div>
              <p className="font-semibold">Create Playlist</p>
              <p className="text-sm text-gray-400">Make your own mix</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
