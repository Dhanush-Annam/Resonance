import TrackCard from './TrackCard'

export default function TrackList({ tracks, onPlay, currentTrack, isPlaying = false, onDelete, role }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 p-4 md:p-6">
      {tracks.map((track, index) => (
        <TrackCard
          key={track._id}
          track={track}
          onPlay={() => onPlay(tracks, index)}
          isActive={currentTrack?._id === track._id}
          isPlaying={currentTrack?._id === track._id && isPlaying}
          onDelete={onDelete}
          role={role}
          priority={index === 0}
        />
      ))}
    </div>
  )
}
