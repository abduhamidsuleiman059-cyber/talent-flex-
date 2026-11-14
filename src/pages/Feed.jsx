import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import VideoCard from '../components/VideoCard'
import { useVideos } from '../context/VideoContext'
import '../styles/feed.css'
import '../styles/feed-topbar.css'

const TABS = [
  { id: 'community', label: 'Community' },
  { id: 'following', label: 'Following' },
  { id: 'foryou', label: 'For You' }
]

function Feed() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('foryou')
  const { videos, followedUsers } = useVideos()
  const scrollRef = useRef(null)
  const scrolledRef = useRef(false)

  const approved = videos.filter(v => v.status === 'approved')

  let list = approved
  if (tab === 'following') {
    list = approved.filter(v => followedUsers.includes(v.username))
  } else if (tab === 'community') {
    // Mpya zaidi kwanza
    list = [...approved].sort((a, b) => b.id - a.id)
  }

  // Kichupo kikibadilika, anza juu
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [tab])

  // Link ya kushiriki (?v=ID): sogea moja kwa moja kwenye video hiyo
  useEffect(() => {
    if (scrolledRef.current) return

    const params = new URLSearchParams(window.location.search)
    const target = params.get('v')
    if (!target) {
      scrolledRef.current = true
      return
    }

    const el = document.getElementById(`video-${target}`)
    if (el) {
      el.scrollIntoView({ block: 'start' })
      scrolledRef.current = true
    }
  }, [approved.length, tab])

  return (
    <div className="feed-wrapper">
      <div className="feed-topbar">
        <div className="feed-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={tab === t.id ? 'feed-tab active' : 'feed-tab'}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <button
          className="feed-search"
          onClick={() => navigate('/explore')}
          aria-label="Gundua"
        >
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      </div>

      <div className="feed-scroll" ref={scrollRef}>
        {list.length === 0 && tab === 'following' && (
          <div className="feed-empty">
            <p>Hujamfuata mtu yeyote bado</p>
            <span>
              Video za watu unaowafuata zitaonekana hapa. Tafuta vipaji upate watu wa kuwafuata.
            </span>
            <button className="feed-empty-btn" onClick={() => navigate('/explore')}>
              Gundua vipaji
            </button>
          </div>
        )}

        {list.map(video => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </div>
  )
}

export default Feed