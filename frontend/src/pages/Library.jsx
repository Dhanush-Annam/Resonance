import { useNavigate } from 'react-router-dom'

export default function Library({ likedCount = 0, recentCount = 0 }) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 bg-black text-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">Your Library</h1>

      <div className="space-y-4">

        {/* Liked Songs */}
        <div
          className="flex items-center gap-4 p-4 bg-zinc-900 rounded cursor-pointer hover:bg-zinc-800"
          onClick={() => navigate('/library/liked')}
        >
          <div className="text-xl">❤️</div>
          <div>
            <p className="font-semibold">Liked Songs</p>
            <p className="text-sm text-gray-400">
              {likedCount} songs
            </p>
          </div>
        </div>

        {/* Recently Played */}
        <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded cursor-pointer hover:bg-zinc-800"
          onClick={() => navigate('/library/recent')}
        >
          <div className="text-xl">🕒</div>
          <div>
            <p className="font-semibold">Recently Played</p>
            <p className="text-sm text-gray-400">
              {recentCount} songs
            </p>
          </div>
        </div>

        {/* Create Playlist */}
        <div className="flex items-center gap-4 p-4 bg-zinc-900 rounded opacity-60">
          <div className="text-xl">➕</div>
          <div>
            <p className="font-semibold">Create Playlist</p>
            <p className="text-sm text-gray-400">Coming soon</p>
          </div>
        </div>

      </div>
    </div>
  )
}
