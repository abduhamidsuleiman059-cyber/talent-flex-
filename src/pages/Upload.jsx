import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVideos } from '../context/VideoContext'
import '../styles/upload.css'
import '../styles/upload-published.css'

// Muda wa juu wa video (sekunde): dakika 30
const MAX_SECONDS = 30 * 60

function formatDuration(sec) {
  const total = Math.round(sec)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function Upload() {
  const navigate = useNavigate()
  const { publishVideo } = useVideos()

  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState('ball')
  const [duration, setDuration] = useState(null)
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [savedOk, setSavedOk] = useState(true)
  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setError('')
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'

    video.onloadedmetadata = () => {
      const dur = video.duration
      if (dur > MAX_SECONDS) {
        setError(
          `Video ni ndefu sana (${formatDuration(dur)}). Inatakiwa isizidi dakika ${MAX_SECONDS / 60}.`
        )
        setVideoFile(null)
        setVideoPreview(null)
        setDuration(null)
        URL.revokeObjectURL(url)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }
      setDuration(formatDuration(dur))
      setVideoFile(file)
      setVideoPreview(url)
    }

    video.onerror = () => {
      setError('Imeshindwa kusoma video hii. Jaribu faili nyingine.')
      URL.revokeObjectURL(url)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }

    video.src = url
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (publishing) return

    if (!videoFile) {
      setError('Tafadhali chagua video kwanza.')
      return
    }
    if (!caption.trim()) {
      setError('Tafadhali andika caption.')
      return
    }

    setError('')
    setPublishing(true)

    const saved = await publishVideo({
      username: '@wewe',
      caption: caption.trim(),
      category,
      videoUrl: videoPreview,
      likes: 0,
      comments: 0
    })

    setSavedOk(saved)
    setPublishing(false)
    setPublished(true)
  }

  const resetForm = () => {
    setVideoFile(null)
    setVideoPreview(null)
    setCaption('')
    setCategory('ball')
    setDuration(null)
    setError('')
    setPublished(false)
    setSavedOk(true)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (published) {
    return (
      <div className="upload-wrapper">
        <div className="pending-screen">
          <div className="published-icon">
            <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2>Video Imechapishwa!</h2>
          <p>
            Video yako "{caption}" iko kwenye <strong>Feed</strong> sasa na inaonekana kwa wengine.
          </p>

          {!savedOk && (
            <p className="upload-warning">
              Video imechapishwa, lakini kifaa kimeshindwa kuihifadhi kabisa (huenda ni kubwa sana
              au nafasi imejaa). Itapotea ukirefresh ukurasa.
            </p>
          )}

          <div className="published-btns">
            <button className="view-feed-btn" onClick={() => navigate('/')}>
              Tazama Feed
            </button>
            <button className="upload-again-btn" onClick={resetForm}>
              Pakia Nyingine
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="upload-wrapper">
      <h2 className="upload-title">Pakia Kipaji Chako</h2>
      <p className="upload-subtitle">
        Video hadi dakika {MAX_SECONDS / 60}. Inachapishwa moja kwa moja kwenye Feed.
      </p>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label className="video-picker" htmlFor="videoInput">
          {videoPreview ? (
            <video src={videoPreview} className="video-preview" controls />
          ) : (
            <div className="picker-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="36" height="36">
                <path d="M23 7l-7 5 7 5V7z"/>
                <rect x="1" y="5" width="15" height="14" rx="2"/>
              </svg>
              <span>Gusa kuchagua video</span>
              <span className="picker-hint">Hadi dakika {MAX_SECONDS / 60}</span>
            </div>
          )}
          <input
            id="videoInput"
            type="file"
            accept="video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            hidden
          />
        </label>

        {duration && <p className="duration-info">Muda wa video: {duration} ✓</p>}
        {error && <p className="upload-error">{error}</p>}

        <textarea
          className="caption-input"
          placeholder="Andika caption ya video yako..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          maxLength={150}
          rows={3}
        />
        <span className="char-count">{caption.length}/150</span>

        <div className="category-picker">
          <button
            type="button"
            className={category === 'ball' ? 'cat-btn active ball' : 'cat-btn ball'}
            onClick={() => setCategory('ball')}
          >
            ⚽ Ball Skills
          </button>
          <button
            type="button"
            className={category === 'music' ? 'cat-btn active music' : 'cat-btn music'}
            onClick={() => setCategory('music')}
          >
            🎵 Music & Beats
          </button>
        </div>

        <button type="submit" className="submit-btn" disabled={publishing}>
          {publishing ? 'Inachapisha...' : 'Chapisha Video'}
        </button>
      </form>
    </div>
  )
}

export default Upload