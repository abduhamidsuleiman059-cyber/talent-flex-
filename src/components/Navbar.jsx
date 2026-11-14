import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useChat } from '../context/ChatContext'
import '../styles/navbar.css'
import '../styles/messages.css'
import '../styles/navbar-tiktok.css'

// Majina ya chini ya ikoni. Badilisha hapa ukitaka Kiswahili (mfano Nyumbani, Marafiki, Ujumbe, Wasifu)
const LABELS = {
  home: 'Home',
  friends: 'Friends',
  inbox: 'Inbox',
  profile: 'Profile'
}

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalUnread } = useChat()
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

  // Bonyeza kwa muda mrefu kitufe cha Profile kufungua Admin
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
    navigate('/profile')
  }

  // Navbar ijifiche ndani ya mazungumzo ili kisanduku cha kuandika kikae chini
  if (location.pathname.startsWith('/messages/')) return null

  const path = location.pathname
  const onHome = path === '/'
  const onFriends = path === '/friends'
  const onInbox = path.startsWith('/messages')
  const onProfile = path === '/profile' || path === '/admin'

  return (
    <nav className={faded ? 'navbar faded' : 'navbar'}>
      <button
        className={onHome ? 'nav-item active' : 'nav-item'}
        onClick={() => navigate('/')}
      >
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.8L3 10.2V21h6.5v-6.2h5V21H21V10.2L12 2.8z" />
        </svg>
        <span className="nav-label">{LABELS.home}</span>
      </button>

      <button
        className={onFriends ? 'nav-item active' : 'nav-item'}
        onClick={() => navigate('/friends')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-3.6 3-6 6.5-6s6.5 2.4 6.5 6" />
          <circle cx="17.5" cy="9" r="2.5" />
          <path d="M17.5 14c2.5 0 4.5 1.7 4.5 4.5" />
        </svg>
        <span className="nav-label">{LABELS.friends}</span>
      </button>

      <button className="nav-upload" onClick={() => navigate('/upload')} aria-label="Pakia video">
        <svg viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.8" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <button
        className={onInbox ? 'nav-item has-badge active' : 'nav-item has-badge'}
        onClick={() => navigate('/messages')}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L3 20.5l1.5-4.7A8 8 0 1 1 21 12z" />
          <line x1="8.5" y1="12" x2="15.5" y2="12" />
        </svg>
        {totalUnread > 0 && (
          <span className="nav-badge">{totalUnread > 9 ? '9+' : totalUnread}</span>
        )}
        <span className="nav-label">{LABELS.inbox}</span>
      </button>

      <button
        className={onProfile ? 'nav-item active' : 'nav-item'}
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(e) => e.preventDefault()}
        onClick={handleProfileClick}
        style={{ WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
        </svg>
        <span className="nav-label">{LABELS.profile}</span>
      </button>
    </nav>
  )
}

export default Navbar