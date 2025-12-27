import { useEffect, useState } from 'react'
import Header from '../components/Header'
import TrackList from '../components/TrackList'

export default function Home({ onPlay }) {
  const [tracks, setTracks] = useState([])

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/tracks/public`)
      .then(res => res.json())
      .then(setTracks)
  }, [])

  return (
    <div className="flex-1 bg-zinc-900 text-white overflow-y-auto">
      <Header />
      <TrackList tracks={tracks} onPlay={onPlay} />
    </div>
  )
}
