import { useState, useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { VideoProvider } from './context/VideoContext'
import Feed from './pages/Feed'
import Upload from './pages/Upload'
import Admin from './pages/Admin'
import Navbar from './components/Navbar'
import Splash from './components/Splash'

const SPLASH_MS = 2500
const FADE_MS = 500

function App() {
  // show -> fade -> done
  const [phase, setPhase] = useState('show')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fade'), SPLASH_MS)
    const t2 = setTimeout(() => setPhase('done'), SPLASH_MS + FADE_MS)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  return (
    <VideoProvider>
      {/* App inapakia wakati splash inafifia, ili video zisicheze nyuma yake */}
      {phase !== 'show' && (
        <HashRouter>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
            <Navbar />
          </div>
        </HashRouter>
      )}

      {phase !== 'done' && <Splash fading={phase === 'fade'} />}
    </VideoProvider>
  )
}

export default App