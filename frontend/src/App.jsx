import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
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
  const [currentTrack, setCurrentTrack] = useState(null)

  return (
    <div className="h-screen flex flex-col bg-black">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <Routes>
          {/* Public */}
          <Route
            path="/"
            element={
              <Home
                onPlay={setCurrentTrack}
                currentTrack={currentTrack}
              />
            }
          />

          <Route
            path="/search"
            element={
              <Search
                onPlay={setCurrentTrack}
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

      <PlayerBar currentTrack={currentTrack} />
    </div>
  )
}

export default App
