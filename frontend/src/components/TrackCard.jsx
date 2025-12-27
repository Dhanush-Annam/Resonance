export default function TrackCard({ track, onPlay }) {
  return (
    <div
      className="bg-zinc-800 hover:bg-zinc-700 transition p-4 rounded-lg cursor-pointer"
      onClick={() => onPlay(track)}
    >
      <h3 className="text-white font-semibold">{track.title}</h3>
      <p className="text-sm text-gray-400">
        {track.artist.username} • {track.genre}
      </p>
    </div>
  )
}
