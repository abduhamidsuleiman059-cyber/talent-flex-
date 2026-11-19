import { useState, useEffect } from 'react'
import { useVideos } from '../context/VideoContext'
import VideoCard from '../components/VideoCard'
import TileGlyph from '../components/TileGlyph'
import { displayName } from '../utils/displayName'
import { getFilterCss } from '../utils/videoFilters'
import '../styles/explore.css'

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

function Explore() {
  const { videos, likedIds } = useVideos()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const approved = videos.filter(v => v.status === 'approved')
  const q = query.trim().toLowerCase()

  const totalLikes = (v) => v.likes + (likedIds.includes(v.id) ? 1 : 0)

  const results = approved
    .filter(v => {
      if (!q) return true
      const haystack = [displayName(v.username), v.username, v.caption || '']
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

  const heading = q ? `Results (${results.length})` : 'Trending'

  return (
    <>
      <div className="explore-wrapper">
        <h2 className="explore-title">Explore</h2>

        <div className="explore-search">
          <span className="explore-search-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            className="explore-search-input"
            placeholder="Search videos or people"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={40}
          />
          {query && (
            <button
              className="explore-search-clear"
              onClick={() => setQuery('')}
              aria-label="Clear"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>

        <h3 className="explore-heading">{heading}</h3>

        {results.length === 0 ? (
          <div className="explore-empty">
            <SearchIcon />
            <p>No results</p>
            <span>Jaribu neno lingine.</span>
          </div>
        ) : (
          <div className="explore-grid">
            {results.map(video => (
              <button
                key={video.id}
                className="explore-tile"
                style={{ background: video.gradient || '#222' }}
                onClick={() => setSelectedId(video.id)}
                aria-label={`Open video by ${displayName(video.username)}`}
              >
                {video.cover ? (
                  <img
                    className="explore-thumb"
                    src={video.cover}
                    alt=""
                    draggable={false}
                  />
                ) : video.videoUrl ? (
                  <video
                    className="explore-thumb"
                    src={`${video.videoUrl}#t=${video.trimStart || 0.1}`}
                    muted
                    playsInline
                    preload="metadata"
                    style={video.filter ? { filter: getFilterCss(video.filter) } : undefined}
                  />
                ) : (
                  <span className="explore-glyph">
                    <TileGlyph category={video.category} />
                  </span>
                )}

                <span className="explore-tile-shade" />

                <span className="explore-tile-info">
                  <span className="explore-tile-user">{displayName(video.username)}</span>
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
            aria-label="Close"
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