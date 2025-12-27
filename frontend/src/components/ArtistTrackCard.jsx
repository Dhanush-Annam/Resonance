import UploadAudioButton from './UploadAudioButton'

export default function ArtistTrackCard({ track, onUpdated }) {
  const statusColors = {
    pending: 'bg-yellow-500',
    approved: 'bg-green-600',
    rejected: 'bg-red-600',
  }

  return (
    <div className="bg-zinc-800 p-4 rounded-lg">
      <h3 className="font-semibold text-lg">{track.title}</h3>
      <p className="text-sm text-gray-400">{track.genre}</p>

      <span
        className={`inline-block text-xs px-2 py-1 rounded mt-2 ${statusColors[track.status]}`}
      >
        {track.status.toUpperCase()}
      </span>

      <div className="mt-4">
        <UploadAudioButton
          track={track}
          onUploaded={onUpdated}
        />
      </div>
    </div>
  )
}
