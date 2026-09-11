import { useNavigate } from 'react-router-dom'
import { Heart, ChevronLeft, Music } from 'lucide-react'
import TrackCard from '../components/TrackCard'

export default function LikedSongs({
  likedTracks = [],
  onPlay,
  currentTrack,
  isPlaying = false,
}) {
  const navigate = useNavigate()

  return (
    <div className="flex-1 bg-zinc-950 text-white p-4 sm:p-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Liked Songs</h1>
            <p className="text-xs text-zinc-400">{likedTracks.length} saved {likedTracks.length === 1 ? 'track' : 'tracks'}</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/library')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-medium text-zinc-300 hover:text-white transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>
      </div>

      {likedTracks.length === 0 ? (
        <div className="py-20 text-center max-w-sm mx-auto">
          <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-3 text-zinc-500">
            <Heart className="w-6 h-6 text-zinc-500" />
          </div>
          <p className="text-sm font-semibold text-zinc-300 mb-1">No liked songs yet</p>
          <p className="text-xs text-zinc-500">
            Songs you like by tapping the heart icon will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {likedTracks.map((track, index) => (
            <TrackCard
              key={track._id}
              track={track}
              onPlay={() => onPlay(likedTracks, index)}
              isActive={currentTrack?._id === track._id}
              isPlaying={currentTrack?._id === track._id && isPlaying}
              priority={index === 0}
            />
          ))}
        </div>
      )}
    </div>
  )
}
