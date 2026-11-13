import { useState, useEffect } from 'react'
import { useVideos } from '../context/VideoContext'
import VideoCard from '../components/VideoCard'
import '../styles/explore.css'

const CATEGORIES = [
  { id: 'all', label: 'Zote' },
  { id: 'ball', label: 'Ball Skills' },
  { id: 'music', label: 'Music & Beats' }
]

const CATEGORY_LABELS = {
  ball: 'Ball Skills',
  music: 'Music & Beats'
}

function formatCount(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K'
  return String(n)
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CloseIcon({ size = 14 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M12 21s-6.7-4.3-9.5-8.2C.6 9.9 1.4 6.4 4.3 4.9c2.4-1.3 5-.6 6.7 1.4 1.7-2 4.3-2.7 6.7-1.4 2.9 1.5 3.7 5 1.8 7.9C18.7 16.7 12 21 12 21z" />
    </svg>
  )
}

function CategoryGlyph({ category }) {
  if (category === 'ball') {
    return (
      <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polygon points="12 8 15.5 10.5 14.2 14.5 9.8 14.5 8.5 10.5" />
        <line x1="12" y1="8" x2="12" y2="3.2" />
        <line x1="15.5" y1="10.5" x2="20" y2="9" />
        <line x1="14.2" y1="14.5" x2="17" y2="18.5" />
        <line x1="9.8" y1="14.5" x2="7" y2="18.5" />
        <line x1="8.5" y1="10.5" x2="4" y2="9" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function Explore() {
  const { videos, likedIds } = useVideos()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const approved = videos.filter(v => v.status === 'approved')
  const q = query.trim().toLowerCase()

  const totalLikes = (v) => v.likes + (likedIds.includes(v.id) ? 1 : 0)

  const results = approved
    .filter(v => filter === 'all' || v.category === filter)
    .filter(v => {
      if (!q) return true
      const haystack = [
        v.username,
        v.caption,
        CATEGORY_LABELS[v.category] || ''
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
    .sort((a, b) => totalLikes(b) - totalLikes(a))

  const selected = approved.find(v => v.id === selectedId) || null

  // Funga video kwa kubonyeza Esc
  useEffect(() => {
    if (!selected) return
    const onKey = (e) => {
      if (e.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected])

  let heading = 'Zinazovuma'
  if (q) heading = `Matokeo (${results.length})`
  else if (filter !== 'all') heading = CATEGORY_LABELS[filter]

  return (
    <>
      <div className="explore-wrapper">
        <h2 className="explore-title">Gundua</h2>

        <div className="explore-search">
          <span className="explore-search-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="explore-search-input"
            placeholder="Tafuta vipaji, watumiaji..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={40}
          />
          {query && (
            <button
              className="explore-search-clear"
              onClick={() => setQuery('')}
              aria-label="Futa maandishi"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>

        <div className="explore-chips">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              className={
                filter === c.id
                  ? `explore-chip active ${c.id}`
                  : `explore-chip ${c.id}`
              }
              onClick={() => setFilter(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <h3 className="explore-heading">{heading}</h3>

        {results.length === 0 ? (
          <div className="explore-empty">
            <SearchIcon />
            <p>Hakuna video iliyopatikana.</p>
            <span>Jaribu neno lingine au kategoria nyingine.</span>
          </div>
        ) : (
          <div className="explore-grid">
            {results.map(video => (
              <button
                key={video.id}
                className="explore-tile"
                style={{ background: video.gradient }}
                onClick={() => setSelectedId(video.id)}
                aria-label={`Fungua video ya ${video.username}`}
              >
                {video.videoUrl ? (
                  <video
                    className="explore-thumb"
                    src={`${video.videoUrl}#t=0.1`}
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <span className="explore-glyph">
                    <CategoryGlyph category={video.category} />
                  </span>
                )}

                <span className="explore-tile-shade" />

                <span className="explore-tile-info">
                  <span className="explore-tile-user">{video.username}</span>
                  <span className="explore-tile-likes">
                    <HeartIcon />
                    {formatCount(totalLikes(video))}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="explore-viewer">
          <button
            className="explore-back"
            onClick={() => setSelectedId(null)}
            aria-label="Rudi"
          >
            <BackIcon />
          </button>
          <div className="explore-viewer-card">
            <VideoCard video={selected} />
          </div>
        </div>
      )}
    </>
  )
}

export default Explore