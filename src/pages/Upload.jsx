import { useState, useRef } from 'react'
import { useVideos } from '../context/VideoContext'
import '../styles/upload.css'

function Upload() {
  const { addPendingVideo } = useVideos()

  const [videoFile, setVideoFile] = useState(null)
  const [videoPreview, setVideoPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [category, setCategory] = useState('ball')
  const [duration, setDuration] = useState(null)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
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
      if (dur > 35) {
        setError(`Video ni ndefu sana (${dur.toFixed(1)}s). Inatakiwa isizidi sekunde 35.`)
        setVideoFile(null)
        setVideoPreview(null)
        return
      }
      setDuration(dur.toFixed(1))
      setVideoFile(file)
      setVideoPreview(url)
    }
    video.src = url
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!videoFile) {
      setError('Tafadhali chagua video kwanza.')
      return
    }
    if (!caption.trim()) {
      setError('Tafadhali andika caption.')
      return
    }

    addPendingVideo({
      username: '@wewe',
      caption,
      category,
      videoUrl: videoPreview,
      likes: 0,
      comments: 0
    })

    setSubmitted(true)
  }

  const resetForm = () => {
    setVideoFile(null)
    setVideoPreview(null)
    setCaption('')
    setCategory('ball')
    setDuration(null)
    setError('')
    setSubmitted(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (submitted) {
    return (
      <div className="upload-wrapper">
        <div className="pending-screen">
          <div className="pending-icon">⏳</div>
          <h2>Video Imepokelewa!</h2>
          <p>Video yako "{caption}" iko kwenye <strong>ukaguzi (review)</strong> kuthibitisha kama ni kipaji halisi.</p>
          <span className="pending-status">Inasubiri Uidhinishwe</span>
          <button className="upload-again-btn" onClick={resetForm}>
            Pakia Nyingine
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="upload-wrapper">
      <h2 className="upload-title">Pakia Kipaji Chako</h2>
      <p className="upload-subtitle">Video sekunde 30-35, kipaji halisi tu (ball skills au music/beats)</p>

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
              <span className="picker-hint">Max sekunde 35</span>
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

        {duration && <p className="duration-info">Muda wa video: {duration}s ✓</p>}
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

        <button type="submit" className="submit-btn">
          Tuma kwa Ukaguzi
        </button>
      </form>
    </div>
  )
}

export default Upload