export default function TrackCard({ track, onPlay, isActive, onDelete, role }) {

  return (
    <div
      onClick={() => onPlay(track)}
      className={`
  relative p-4 rounded-lg cursor-pointer transition
  ${isActive
          ? 'bg-green-600 text-white'
          : 'bg-zinc-800 hover:bg-zinc-700'}
`}

    >
      <img
        src={track.coverUrl || '/no-image.jpg'}
        className="w-full h-80 object-cover rounded"
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

