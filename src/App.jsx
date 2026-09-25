import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { VideoProvider } from './context/VideoContext'
import Feed from './pages/Feed'
import Upload from './pages/Upload'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'

function App() {
  return (
    <VideoProvider>
      <BrowserRouter>
        <div className="app-container">
          <Routes>
            <Route path="/" element={<Feed />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
          <Navbar />
        </div>
      </BrowserRouter>
    </VideoProvider>
  )
}

export default App