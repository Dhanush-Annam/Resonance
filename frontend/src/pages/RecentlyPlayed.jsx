import { useNavigate } from 'react-router-dom'

export default function RecentlyPlayed({ tracks = [], onPlay, currentTrack }) {

    const navigate = useNavigate()

    const trackList = tracks.map(r => r.track)

    return (
        <div className="flex-1 bg-black text-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">🕒 Recently Played</h1>
                <button
                    onClick={() => navigate('/library')}
                    className="px-3 py-2 rounded bg-zinc-900 hover:bg-zinc-800"
                >
                    Back
                </button>
            </div>

            {trackList.length === 0 ? (
                <p className="text-gray-400">No recently played songs.</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {trackList.map((track, index) => (
                        <div
                            key={track._id}
                            onClick={() => onPlay(trackList, index)}
                            className={`p-4 rounded cursor-pointer hover:bg-zinc-800 ${currentTrack?._id === track._id
                                    ? 'bg-zinc-800'
                                    : 'bg-zinc-900'
                                }`}
                        >
                            <img
                                src={track.coverUrl || '/no-image.jpg'}
                                className="w-full h-44 object-cover rounded mb-3"
                            />
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
