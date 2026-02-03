import { useState , useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useLocation } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import PlayerBar from './components/PlayerBar'
import Home from './pages/Home'
import Search from './pages/Search'
import Library from './pages/Library'
import Login from './pages/Login'
import Register from './pages/Register'
import ProtectedRoute from './components/ProtectedRoute'
import ArtistDashboard from './pages/ArtistDashboard'
import AdminDashboard from './pages/AdminDashboard'
import AdminCreateTrack from './pages/AdminCreateTrack'
import LikedSongs from './pages/LikedSongs'

function App() {
  const [queue, setQueue] = useState([])
  const [currentIndex, setCurrentIndex] = useState(null)
  const currentTrack = currentIndex !== null ? queue[currentIndex] : null

  const handlePlay = (tracks, index) => {
  setQueue(tracks)
  setCurrentIndex(index)
}

const playNext = () => {
  setCurrentIndex(prev => {
    if (prev === null){return prev;}
    if (prev + 1 < queue.length){return prev + 1;}
    return prev;
  })
}

const playPrev = () => {
  setCurrentIndex(prev => {
    if (prev === null){return prev;}
    if (prev - 1 >= 0){return prev - 1;}
    return prev;
  })
}

const [likedTracks, setLikedTracks] = useState([])


useEffect(() => {
  const token = sessionStorage.getItem('token');
  if(!token) return
  const fetchLikedSongs = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/library/likes`,
        {
          headers: {
            Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          },
        }
      )

      if (!res.ok) return

      const data = await res.json()
      setLikedTracks(data)
    }
    catch (err) {
      console.error('Failed to load liked songs', err)
    }
  }

  fetchLikedSongs()
}, [])

const toggleLike = async (track) => {
  if (!track?._id) return

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/library/likes/${track._id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      }
    )

    if (!res.ok) return

    const { liked } = await res.json()

    setLikedTracks(prev => {
      if (liked) {
        if (prev.some(i => i._id === track._id)) return prev
        return [track, ...prev]
      }
      else {
        return prev.filter(i => i._id !== track._id)
      }
    })
  }
  catch (err) {
    console.error('Toggle like failed', err)
  }
}

  const location = useLocation()
  const hideSidebarRoutes = ['/login', '/register']
  const hideSidebar = hideSidebarRoutes.includes(location.pathname)

  return (
    <div className="h-screen flex flex-col bg-black">
      <Header/>
      <div className="flex flex-1 overflow-hidden">
        {!hideSidebar && <Sidebar />}

        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              <Home
                onPlay={handlePlay}
                currentTrack={currentTrack}
              />
            }
          />

          <Route
            path="/search"
            element={
              <Search
                onPlay={handlePlay}
                currentTrack={currentTrack}
              />
            }
          />

          <Route element={<ProtectedRoute roles={['user', 'artist', 'admin']} />}>
          <Route
            path="/library"
            element={<Library likedCount={likedTracks.length}/>}
          />
          <Route
            path="/library/liked"
            element={
            <LikedSongs 
              likedTracks={likedTracks}
              onPlay={handlePlay}
              currentTrack={currentTrack}
            />
            }
          />
          </Route>

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Artist protected */}
          <Route element={<ProtectedRoute roles={['artist']} />}>
            <Route path="/artist" element={<ArtistDashboard />} />
          </Route>


          {/* Admin (nested & protected) */}
          <Route
            element={<ProtectedRoute roles={['admin']} />}
          >
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/create" element={<AdminCreateTrack />} />
          </Route>
        </Routes>
      </div>

      {!hideSidebar && 
      <PlayerBar 
      currentTrack={currentTrack}
      onNext={playNext}
      onPrev={playPrev}
      likedTrackIds={likedTracks.map(i => i._id)}
      onToggleLike={toggleLike}
      />}
    </div>
  )
}

export default App
