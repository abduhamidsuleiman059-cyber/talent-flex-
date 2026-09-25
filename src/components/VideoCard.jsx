import '../styles/videocard.css'

function VideoCard({ video }) {
  const tagColor = video.category === 'ball' ? '#00D4AA' : '#C724F5'
  const tagLabel = video.category === 'ball' ? 'Ball Skills' : 'Music & Beats'

  return (
    <div className="video-card" style={{ background: video.gradient }}>
      <div className="video-overlay">
        <span className="video-tag" style={{ borderColor: tagColor, color: tagColor }}>
          {tagLabel}
        </span>
        <div className="video-info">
          <h3>{video.username}</h3>
          <p>{video.caption}</p>
        </div>
      </div>

      <div className="video-actions">
        <button className="action-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="30" height="30">
            <path d="M12 21s-6.7-4.3-9.5-8.2C.6 9.9 1.4 6.4 4.3 4.9c2.4-1.3 5-.6 6.7 1.4 1.7-2 4.3-2.7 6.7-1.4 2.9 1.5 3.7 5 1.8 7.9C18.7 16.7 12 21 12 21z"/>
          </svg>
          <span>{video.likes}</span>
        </button>
        <button className="action-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
            <path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-5 4V6a2 2 0 0 1 2-2z"/>
          </svg>
          <span>{video.comments}</span>
        </button>
        <button className="action-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="28" height="28">
            <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"/>
            <polyline points="16 6 12 2 8 6"/>
            <line x1="12" y1="2" x2="12" y2="15"/>
          </svg>
          <span>Share</span>
        </button>
      </div>
    </div>
  )
}

export default VideoCard