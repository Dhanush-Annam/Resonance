import TrackCard from './TrackCard'

export default function TrackList({ tracks, onPlay, currentTrack }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {tracks.map(track => (
        <TrackCard
          key={track._id}
          track={track}
          onPlay={onPlay}
          isActive={currentTrack?._id === track._id}
        />
      ))}
    </div>
  )
}
