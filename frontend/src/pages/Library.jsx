import { useNavigate } from 'react-router-dom'
import { Heart, Clock, ListMusic, PlusCircle, Library as LibraryIcon } from 'lucide-react'

export default function Library({ likedCount = 0, recentCount = 0, playlists = [] }) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 bg-zinc-950 text-white p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <LibraryIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Your Library</h1>
          <p className="text-xs text-zinc-400">Saved tracks, listening history, and custom mixes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Liked Songs */}
        <div
          className="group p-5 bg-linear-to-br from-rose-950/40 to-zinc-900/80 border border-zinc-800/80 hover:border-rose-500/40 rounded-2xl cursor-pointer hover:bg-zinc-800/60 transition-all duration-300 shadow-md hover:shadow-xl"
          onClick={() => navigate('/library/liked')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 transition-transform">
              <Heart className="w-6 h-6 fill-rose-500" />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-rose-300 transition-colors">Liked Songs</p>
              <p className="text-xs text-zinc-400 mt-0.5">{likedCount} favorite {likedCount === 1 ? 'track' : 'tracks'}</p>
            </div>
          </div>
        </div>

        {/* Recently Played */}
        <div
          className="group p-5 bg-linear-to-br from-indigo-950/40 to-zinc-900/80 border border-zinc-800/80 hover:border-indigo-500/40 rounded-2xl cursor-pointer hover:bg-zinc-800/60 transition-all duration-300 shadow-md hover:shadow-xl"
          onClick={() => navigate('/library/recent')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-indigo-300 transition-colors">Recently Played</p>
              <p className="text-xs text-zinc-400 mt-0.5">{recentCount} tracks in history</p>
            </div>
          </div>
        </div>

        {/* Custom Playlists */}
        {playlists.map((p) => (
          <div
            key={p._id}
            className="group p-5 bg-zinc-900/70 border border-zinc-800/80 hover:border-emerald-500/40 rounded-2xl cursor-pointer hover:bg-zinc-800/60 transition-all duration-300 shadow-md hover:shadow-xl"
            onClick={() => navigate(`/library/playlists/${p._id}`)}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <ListMusic className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">{p.name}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{p.trackCount || (Array.isArray(p.tracks) ? p.tracks.length : 0)} tracks</p>
              </div>
            </div>
          </div>
        ))}

        {/* Create Playlist Button */}
        <div
          className="group p-5 bg-zinc-900/40 border border-dashed border-zinc-800 hover:border-emerald-500/60 rounded-2xl cursor-pointer hover:bg-zinc-900/80 transition-all duration-300 flex items-center"
          onClick={() => navigate('/library/playlists/new')}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 group-hover:border-emerald-500/40 transition">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-semibold text-zinc-200 group-hover:text-white transition-colors">Create Playlist</p>
              <p className="text-xs text-zinc-500">Make your own mix</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
