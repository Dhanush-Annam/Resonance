import { useEffect, useRef, useState } from 'react'

export default function PlayerBar({ currentTrack, onNext , onPrev , likedTrackIds=[] , onToggleLike}) {
  const audioRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const isLiked =  currentTrack && likedTrackIds.includes(currentTrack._id)

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }


  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [currentTrack])

  if (!currentTrack) {
    return (
      <div className="h-20 bg-zinc-900 border-t border-zinc-800 flex items-center justify-center text-gray-400">
        Select a track to play
      </div>
    )
  }

  return (
    <div className="h-20 bg-zinc-900 border-t border-zinc-800 flex items-center px-4">

      {/* LEFT: Track Info */}
      <div className="flex items-center gap-4 w-1/3">
        <img
          src={currentTrack.coverUrl || '/placeholder.png'}
          className="h-14 w-14 rounded object-cover"
        />
        <div>
          <p className="text-white text-sm font-semibold">
            {currentTrack.title}
          </p>
          <p className="text-xs text-gray-400">
            {currentTrack.artist?.username || 'Unknown Artist'}
          </p>
        </div>
        <div>
          {currentTrack && (
          <button
            onClick={() => onToggleLike(currentTrack)}
            className="ml-3 text-xl"
            title={isLiked ? 'Unlike' : 'Like'}
          >
          {isLiked ? '❤️' : '🤍'}
          </button>
          )}
        </div>
      </div>

      {/* CENTER: Controls */}
      <div className="flex flex-col items-center w-1/3">
        <div className="flex items-center gap-4 mb-1">
          <button 
            className="text-gray-400 hover:text-white"
            onClick={onPrev}
            >
            ⏮
          </button>

          <button
            className=" text-black rounded-full h-8 w-8 flex items-center justify-center"
            onClick={togglePlay}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <button 
            className="text-gray-400 hover:text-white"
            onClick={onNext}
            >
            ⏭
            </button>
        </div>

        <div className="flex items-center gap-2 w-full">
          <span className="text-xs text-gray-400">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            value={progress}
            onChange={(e) => {
              const time = (e.target.value / 100) * duration
              audioRef.current.currentTime = time
              setCurrentTime(time)
            }}
            className="w-full"
          />
          <span className="text-xs text-gray-400">
            {formatTime(duration)}
          </span>

        </div>
      </div>

      {/* RIGHT: Volume */}
      <div className="flex items-center justify-end gap-2 w-1/3">
        <span className="text-gray-400">🔊</span>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="w-24"
        />
      </div>

      {/* AUDIO */}
      <audio
        ref={audioRef}
        src={currentTrack.audioUrl}
        onTimeUpdate={() => {
          const current = audioRef.current.currentTime
          const dur = audioRef.current.duration || 0

          setCurrentTime(current)
          setDuration(dur)
          setProgress(dur ? (current / dur) * 100 : 0)
        }}
        onEnded={() => {
          setIsPlaying(false)
          onNext?.()
          }
        }
        autoPlay
      />

    </div>
  )
}
