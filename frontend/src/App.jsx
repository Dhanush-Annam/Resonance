import { useState } from 'react'
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

          <Route path="/library" element={<Library />} />
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

      {!hideSidebar && <PlayerBar currentTrack={currentTrack} onNext={playNext} onPrev={playPrev}/>}
    </div>
  )
}

export default App
