export default function LikedSongs({
  likedTracks = [],
  onPlay,
  currentTrack,
}) {
  return (
    <div className="flex-1 bg-black text-white p-6 overflow-y-auto">
      <h1 className="text-2xl font-bold mb-6">❤️ Liked Songs</h1>

      {likedTracks.length === 0 ? (
        <p className="text-gray-400">No liked songs yet.</p>
      ) : (
        <div className="space-y-2">
          {likedTracks.map((track, index) => (
            <div
              key={track._id}
              onClick={() => onPlay(likedTracks, index)}
              className={`p-3 rounded cursor-pointer hover:bg-zinc-800 ${
                currentTrack?._id === track._id
                  ? 'bg-zinc-800'
                  : 'bg-zinc-900'
              }`}
            >
              <p className="font-medium">{track.title}</p>
              <p className="text-sm text-gray-400">
                {track.artist?.username || 'Unknown Artist'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
