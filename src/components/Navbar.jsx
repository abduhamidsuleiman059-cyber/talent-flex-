import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/navbar.css'

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [faded, setFaded] = useState(false)
  const scrollTimeout = useRef(null)
  const pressTimer = useRef(null)
  const longPressed = useRef(false)

  // Inasikiliza scroll ya Feed kila ukurasa unapobadilika
  useEffect(() => {
    const feedEl = document.querySelector('.feed-scroll')
    if (!feedEl) return

    const handleScroll = () => {
      setFaded(true)
      clearTimeout(scrollTimeout.current)
      scrollTimeout.current = setTimeout(() => {
        setFaded(false)
      }, 500)
    }

    feedEl.addEventListener('scroll', handleScroll)
    return () => feedEl.removeEventListener('scroll', handleScroll)
  }, [location.pathname])

  // Bonyeza kwa muda mrefu kitufe cha Wasifu kufungua Admin
  const startPress = () => {
    longPressed.current = false
    clearTimeout(pressTimer.current)
    pressTimer.current = setTimeout(() => {
      longPressed.current = true
      navigate('/admin')
    }, 700)
  }

  const endPress = () => {
    clearTimeout(pressTimer.current)
  }

  const handleProfileClick = () => {
    // Ikiwa ni bonyezo refu, Admin imeshafunguliwa tayari
    if (longPressed.current) {
      longPressed.current = false
      return
    }
    // Bonyezo la kawaida: Wasifu bado haujajengwa
  }

  return (
    <nav className={faded ? 'navbar faded' : 'navbar'}>
      <button
        className={location.pathname === '/' ? 'nav-item active' : 'nav-item'}
        onClick={() => navigate('/')}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M12 3l9 8h-3v9h-5v-6H11v6H6v-9H3l9-8z"/>
        </svg>
        <span className="nav-label">Feed</span>
      </button>

      <button
        className={location.pathname === '/explore' ? 'nav-item active' : 'nav-item'}
        onClick={() => navigate('/explore')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
          <circle cx="11" cy="11" r="7"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span className="nav-label">Gundua</span>
      </button>

      <button className="nav-upload" onClick={() => navigate('/upload')}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="2.5" width="22" height="22">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>

      <button className="nav-item">
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z"/>
        </svg>
        <span className="nav-label">Ujumbe</span>
      </button>

      <button
        className={location.pathname === '/admin' ? 'nav-item active' : 'nav-item'}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(e) => e.preventDefault()}
        onClick={handleProfileClick}
        style={{ WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>
        </svg>
        <span className="nav-label">Wasifu</span>
      </button>
    </nav>
  )
}

export default Navbar