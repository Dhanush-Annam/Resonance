import TrackCard from './TrackCard'

export default function TrackList({ tracks, onPlay, currentTrack, onDelete, role }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {tracks.map((track , index) => (
        <TrackCard
          key={track._id}
          track={track}
          onPlay={()=> onPlay(tracks , index)}
          isActive={currentTrack?._id === track._id}
          onDelete={onDelete}
          role={role}
        />
      ))}
    </div>
  )
}
