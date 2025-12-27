export default function PlayerBar({ currentTrack }) {
  if (!currentTrack) {
    return (
      <div className="h-20 bg-zinc-900 text-gray-400 flex items-center justify-center">
        Select a track to play
      </div>
    )
  }

  return (
    <div className="h-20 bg-zinc-900 px-4 flex items-center justify-between">
      <div>
        <p className="text-white font-medium">{currentTrack.title}</p>
        <p className="text-sm text-gray-400">
          {currentTrack.artist.username}
        </p>
      </div>

      <audio
        controls
        src={currentTrack.audioUrl}
        className="w-1/2"
        autoPlay
      />
    </div>
  )
}
