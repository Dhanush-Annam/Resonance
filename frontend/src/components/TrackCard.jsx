import { cloudinaryCoverSrcSet, cloudinaryCoverUrl } from '../utils/cloudinary'

export default function TrackCard({
  track,
  onPlay,
  isActive,
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

  return (
    <div
      onClick={onPlay}
      className={`
  relative p-4 rounded-lg cursor-pointer transition
  ${isActive
          ? 'bg-green-600 text-white'
          : 'bg-zinc-800 hover:bg-zinc-700'}
`}

    >
      <img
        src={coverSrc}
        srcSet={coverSrcSet}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        alt={track.title ? `${track.title} cover` : 'Track cover'}
        className="w-full h-80 object-cover object-center rounded"
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />

      <h3 className="font-semibold">{track.title}</h3>
      <p className="text-sm opacity-80">
        {track.artist.username} • {track.genre}
      </p>
      {role === 'admin' && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(track._id)
          }}

          className="absolute top-2 right-2 z-10 text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded"

        >
          🗑
        </button>
      )}

      {isActive && (
        <p className="text-xs mt-2 font-medium">
          ▶ Now Playing
        </p>
      )}
    </div>
  )
}

