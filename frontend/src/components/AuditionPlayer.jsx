import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, AlertCircle } from 'lucide-react'

/**
 * Resonance Design System — Custom Audition Audio Player (<AuditionPlayer />)
 *
 * Conforms to DESIGN.md Section 6.3 & Phase 6 Curatorial Desk Requirements:
 * - Direct replacement for raw browser <audio controls> with dark editorial styling
 * - Strict mutual exclusivity coordinated via `isActive` and `onPlay`
 * - Slider-scoped keyboard seeking (ArrowLeft/ArrowRight) only when the slider has focus
 * - Native button Space/Enter activation without global window key listeners
 * - Pointer-capture scrubber preventing buffer thrashing during drag
 * - Graceful codec error handling with non-blocking alert
 * - Timers rendered in JetBrains Mono with tabular-nums
 * - Complete teardown and audio element cleanup on unmount
 */
export default function AuditionPlayer({
  audioUrl,
  isActive = false,
  onPlay,
  onPause,
  className = '',
}) {
  const audioRef = useRef(null)
  const sliderRef = useRef(null)

  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0) // 0 to 1

  // Formatting utility (JetBrains Mono tabular-nums)
  const formatTime = (secs) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  // Pause playback when parent deactivates this player
  useEffect(() => {
    if (!isActive && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause()
    }
  }, [isActive])

  // Reset player state whenever audioUrl changes
  useEffect(() => {
    setHasError(false)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [audioUrl])

  // Lifecycle cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Audio element event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0)
      setHasError(false)
    }
  }

  const handleTimeUpdate = () => {
    if (!isDragging && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime || 0)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
    if (onPause) onPause()
  }

  const handleAudioError = () => {
    // Only flag error if there is an active audioUrl and a true media error on the element
    if (!audioUrl || !audioRef.current) return
    const mediaError = audioRef.current.error
    if (mediaError) {
      console.warn('Audition audio media error:', mediaError.code, mediaError.message)
      setHasError(true)
      setIsPlaying(false)
    }
  }

  // Toggle playback
  const handleTogglePlay = () => {
    if (!audioRef.current || hasError || !audioUrl) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      if (onPause) onPause()
    } else {
      if (onPlay) onPlay()
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true)
            setHasError(false)
          })
          .catch((err) => {
            console.warn('Audition playback failed:', err)
            setIsPlaying(false)
            // AbortError happens when playback is interrupted (e.g. paused or parent deactivated)
            // NotAllowedError happens when browser autoplay policy blocks unprompted playback
            if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
              setHasError(true)
            }
          })
      }
    }
  }

  // Toggle Mute
  const handleToggleMute = () => {
    if (!audioRef.current) return
    const nextMute = !isMuted
    audioRef.current.muted = nextMute
    setIsMuted(nextMute)
  }

  // Calculate seek ratio from pointer event
  const getSeekRatio = useCallback((e) => {
    if (!sliderRef.current) return 0
    const rect = sliderRef.current.getBoundingClientRect()
    if (rect.width <= 0) return 0
    const clientX = e.clientX
    const ratio = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(1, ratio))
  }, [])

  // Pointer Scrubbing with setPointerCapture
  const handlePointerDown = (e) => {
    if (!audioRef.current || hasError || duration <= 0) return
    e.preventDefault()
    e.stopPropagation()

    try {
      e.target.setPointerCapture(e.pointerId)
    } catch {
      // Fallback if pointer capture is not supported
    }

    setIsDragging(true)
    const ratio = getSeekRatio(e)
    setDragProgress(ratio)
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const ratio = getSeekRatio(e)
    setDragProgress(ratio)
  }

  const handlePointerUp = (e) => {
    if (!isDragging) return
    e.preventDefault()
    try {
      e.target.releasePointerCapture(e.pointerId)
    } catch {
      // Fallback
    }

    const ratio = getSeekRatio(e)
    const targetTime = ratio * duration
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime
      setCurrentTime(targetTime)
    }
    setIsDragging(false)
  }

  const handlePointerCancel = (e) => {
    if (!isDragging) return
    try {
      e.target.releasePointerCapture(e.pointerId)
    } catch {
      // Fallback
    }
    setIsDragging(false)
  }

  // Slider-Scoped Keyboard Seeking: ONLY when slider element itself has focus
  const handleSliderKeyDown = (e) => {
    if (!audioRef.current || hasError || duration <= 0) return

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      e.stopPropagation()
      const newTime = Math.max(0, (audioRef.current.currentTime || 0) - 5)
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      e.stopPropagation()
      const newTime = Math.min(duration, (audioRef.current.currentTime || 0) + 5)
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const effectiveProgress = isDragging
    ? dragProgress
    : duration > 0
    ? currentTime / duration
    : 0
  const progressPercent = Math.min(100, Math.max(0, effectiveProgress * 100))

  return (
    <div
      className={`bg-surface-raised border border-border-rule rounded-sm p-2 sm:p-2.5 flex flex-col gap-1.5 select-none ${className}`.trim()}
    >
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onError={handleAudioError}
      />

      {hasError ? (
        <div className="flex items-center justify-between gap-2 py-1 text-xs font-sans">
          <div className="flex items-center gap-1.5 text-status-rejected-fg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Audio master unplayable in browser</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setHasError(false)
              if (audioRef.current) {
                audioRef.current.load()
              }
            }}
            className="text-[11px] font-mono text-text-secondary hover:text-text-primary underline shrink-0 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={!audioUrl || hasError}
              aria-label={isPlaying ? 'Pause audition' : 'Audition master recording'}
              className="w-7 h-7 shrink-0 rounded-sm bg-surface-elevated hover:bg-surface-hover text-text-primary border border-border-control flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
              )}
            </button>

            {/* Scrubber Slider Track (Dedicated Focus Target) */}
            <div
              ref={sliderRef}
              role="slider"
              tabIndex={audioUrl && !hasError ? 0 : -1}
              aria-label="Audition playback position"
              aria-valuenow={Math.round(currentTime)}
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
              onKeyDown={handleSliderKeyDown}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              className="relative flex-1 h-5 flex items-center cursor-pointer group touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-1 focus-visible:ring-offset-surface-raised rounded-xs"
            >
              {/* Rail */}
              <div className="w-full h-1 bg-surface-elevated border border-border-subtle rounded-xs overflow-hidden relative">
                {/* Progress Fill */}
                <div
                  className="h-full bg-text-primary transition-all duration-75"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Thumb */}
              <div
                className="absolute w-2.5 h-2.5 bg-text-primary rounded-xs border border-surface-raised shadow -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            {/* Mute Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              disabled={!audioUrl || hasError}
              aria-label={isMuted ? 'Unmute audition' : 'Mute audition'}
              className="p-1 rounded-sm text-text-tertiary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus disabled:opacity-40"
            >
              {isMuted ? (
                <VolumeX className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Timers Row */}
          <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-text-tertiary px-0.5">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </>
      )}
    </div>
  )
}
