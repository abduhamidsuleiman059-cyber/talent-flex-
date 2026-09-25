import { useVideos } from '../context/VideoContext'
import '../styles/admin.css'

function Admin() {
  const { videos, approveVideo, rejectVideo } = useVideos()
  const pending = videos.filter(v => v.status === 'pending')

  return (
    <div className="admin-wrapper">
      <h2>Ukaguzi wa Video ({pending.length})</h2>
      {pending.length === 0 && (
        <p className="admin-empty">Hakuna video inayosubiri ukaguzi kwa sasa.</p>
      )}
      <div className="admin-list">
        {pending.map(video => (
          <div className="admin-card" key={video.id}>
            {video.videoUrl && (
              <video src={video.videoUrl} className="admin-preview" controls />
            )}
            <div className="admin-info">
              <span className="admin-tag">
                {video.category === 'ball' ? '⚽ Ball Skills' : '🎵 Music & Beats'}
              </span>
              <p>{video.caption}</p>
            </div>
            <div className="admin-actions">
              <button className="approve-btn" onClick={() => approveVideo(video.id)}>
                Idhinisha ✓
              </button>
              <button className="reject-btn" onClick={() => rejectVideo(video.id)}>
                Kataa ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Admin