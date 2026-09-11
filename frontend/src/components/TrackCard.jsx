import { Play, Pause, Trash2, Volume2 } from 'lucide-react'
import { cloudinaryCoverSrcSet, cloudinaryCoverUrl } from '../utils/cloudinary'

export default function TrackCard({
  track,
  onPlay,
  isActive,
  isPlaying = false,
  onDelete,
  role,
  priority = false,
}) {
  const rawCoverUrl = track.coverUrl || '/no-image.jpg'
  const coverSrc = cloudinaryCoverUrl(rawCoverUrl, { w: 800 })
  const coverSrcSet = cloudinaryCoverSrcSet(rawCoverUrl, [
    { w: 400 },
    { w: 800 },
    { w: 1200 },
  ])

  const isCurrentlyPlaying = isActive && isPlaying

  return (
    <div
      onClick={onPlay}
      className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-300 border ${
        isActive
          ? 'bg-zinc-800/90 border-emerald-500/40 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
          : 'bg-zinc-900/60 hover:bg-zinc-800/70 border-zinc-800/60 hover:border-zinc-700/80 shadow-md hover:shadow-xl'
      }`}
    >
      {/* Cover Artwork Container */}
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-zinc-800 mb-3 shadow-inner">
        <img
          src={coverSrc}
          srcSet={coverSrcSet}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          alt={track.title ? `${track.title} cover` : 'Track cover'}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          decoding="async"
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />

        {/* Floating Spotify-style Emerald Play Button */}
        <div className="absolute right-2.5 bottom-2.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPlay()
            }}
            aria-label={isCurrentlyPlaying ? 'Pause' : 'Play'}
            className={`w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-xl shadow-black/60 transition-all duration-300 transform ${
              isActive
                ? 'opacity-100 translate-y-0 scale-100'
                : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 hover:scale-105'
            }`}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>
        </div>

        {/* Admin Delete Button */}
        {role === 'admin' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(track._id)
            }}
            title="Delete track"
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-black/60 hover:bg-red-600/90 text-zinc-300 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1.5">
          <h3
            className={`font-semibold text-sm truncate ${
              isActive ? 'text-emerald-400' : 'text-zinc-100 group-hover:text-white'
            }`}
            title={track.title}
          >
            {track.title}
          </h3>
          {isActive && (
            <span className="flex items-center gap-0.5 shrink-0" title={isCurrentlyPlaying ? 'Now Playing' : 'Paused'}>
              <span className={`w-1 h-3 bg-emerald-400 rounded-full ${isCurrentlyPlaying ? 'animate-pulse' : 'opacity-40'}`} />
              <span className={`w-1 h-4 bg-emerald-400 rounded-full ${isCurrentlyPlaying ? 'animate-pulse delay-75' : 'opacity-40'}`} />
              <span className={`w-1 h-2 bg-emerald-400 rounded-full ${isCurrentlyPlaying ? 'animate-pulse delay-150' : 'opacity-40'}`} />
            </span>
          )}
        </div>

        <p className="text-xs text-zinc-400 truncate">
          {track.artist?.username || 'Unknown Artist'}
          {track.genre && <span className="text-zinc-600"> • </span>}
          {track.genre && <span className="text-zinc-400">{track.genre}</span>}
        </p>
      </div>
    </div>
  )
}
